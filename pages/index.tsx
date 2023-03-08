import { useState } from 'react'

import { BlackPawn, WhitePawn } from '@/svg/Pawn'
import Head from 'next/head'

const BOARD_COL = 6
const BOARD_ROW = 6

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Home() {
  const [board, setBoard] = useState([
    ['B', 'B', 'B', 'B', 'B', 'B'],
    ['B', 'B', 'B', 'B', 'B', 'B'],
    ['_', '_', '_', '_', '_', '_'],
    ['_', '_', '_', '_', '_', '_'],
    ['W', 'W', 'W', 'W', 'W', 'W'],
    ['W', 'W', 'W', 'W', 'W', 'W'],
  ])
  const [selected, setSelected] = useState<number | null>(null)
  const [turn, setTurn] = useState<'B' | 'W'>('W')
  const [movableSquares, setMovableSquares] = useState<number[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [botMoving, setBotMoving] = useState(false)

  const getMovableSquares = (row: number, col: number, piece: string) => {
    const movableSquares = []
    for (let dc = -1; dc <= 1; dc++) {
      const nr = row + (piece === 'B' ? 1 : -1),
        nc = col + dc
      if (nr < 0 || nr >= BOARD_ROW || nc < 0 || nc >= BOARD_COL) continue
      if (board[nr][nc] === piece) continue
      if (dc === 0 && board[nr][nc] === (piece === 'B' ? 'W' : 'B')) continue
      movableSquares.push(nr * BOARD_COL + nc)
    }

    return movableSquares
  }

  const resetGame = () => {
    setBoard([
      ['B', 'B', 'B', 'B', 'B', 'B'],
      ['B', 'B', 'B', 'B', 'B', 'B'],
      ['_', '_', '_', '_', '_', '_'],
      ['_', '_', '_', '_', '_', '_'],
      ['W', 'W', 'W', 'W', 'W', 'W'],
      ['W', 'W', 'W', 'W', 'W', 'W'],
    ])
    setSelected(null)
    setMovableSquares([])
    setTurn('W')
    setGameOver(false)
  }

  const handleMove = (src: number, dst: number) => {
    const srcRow = Math.floor(src / BOARD_COL)
    const srcCol = src % BOARD_COL
    const dstRow = Math.floor(dst / BOARD_COL)
    const dstCol = dst % BOARD_COL

    const newBoard = [...board]
    newBoard[dstRow][dstCol] = newBoard[srcRow][srcCol]
    newBoard[srcRow][srcCol] = '_'

    setBoard(newBoard)
    setSelected(null)
    setMovableSquares([])

    if (isGameOver(newBoard)) {
      setGameOver(true)
      return
    }

    setTurn((turn) => (turn === 'B' ? 'W' : 'B'))
  }

  const handleBotMove = () => {
    const fetchMove = async () => {
      const payload = turn === 'B' ? board : invertBoard(board)

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (response.ok) {
          const [src, dst] = await response.json()

          const srcIndex =
            turn === 'B'
              ? src[0] * BOARD_COL + src[1]
              : (BOARD_ROW - src[0] - 1) * BOARD_COL + src[1]
          const dstIndex =
            turn === 'B'
              ? dst[0] * BOARD_COL + dst[1]
              : (BOARD_ROW - dst[0] - 1) * BOARD_COL + dst[1]

          handleMove(srcIndex, dstIndex)
        }
      } catch (error) {
        console.log(error)
      }

      setBotMoving(false)
    }

    setBotMoving(true)
    fetchMove()
  }

  const isGameOver = (board: string[][]) => {
    let blackCount = 0,
      whiteCount = 0
    for (let row = 0; row < BOARD_ROW; row++) {
      for (let col = 0; col < BOARD_COL; col++) {
        if (board[row][col] === 'B') ++blackCount
        if (board[row][col] === 'W') ++whiteCount

        if (row == 0 && board[row][col] === 'W') return true
        if (row == BOARD_ROW - 1 && board[row][col] === 'B') return true
      }
    }

    return blackCount === 0 || whiteCount === 0
  }

  const invertBoard = (board: string[][]) => {
    const newBoard = []
    for (let row = 0; row < BOARD_ROW; row++) {
      const newRow = []
      for (let col = 0; col < BOARD_COL; col++) {
        let piece = board[BOARD_ROW - row - 1][col]
        newRow.push(piece === 'B' ? 'W' : piece === 'W' ? 'B' : '_')
      }
      newBoard.push(newRow)
    }

    return newBoard
  }

  return (
    <>
      <Head>
        <title>Breakthrough</title>
        <meta
          name="description"
          content="A Frontend UI for CS2109S Mini Project - Breakthrough"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center bg-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h3 className="text-center text-2xl font-bold text-gray-900">
            {gameOver ? 'Winner' : 'Turn'}:{' '}
            {turn === 'B' ? (
              <BlackPawn className="-mt-2 inline-block h-10 w-10" />
            ) : (
              <WhitePawn className="-mt-2 inline-block h-10 w-10" />
            )}
          </h3>
          <div className="mt-8">
            <div className="flex flex-col divide-y divide-gray-200 overflow-hidden rounded-md border border-gray-200 shadow">
              {board.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className="grid flex-1 grid-cols-6 divide-x divide-gray-200"
                >
                  {row.map((col, colIndex) => (
                    <div
                      key={rowIndex * BOARD_COL + colIndex}
                      className="aspect-square"
                    >
                      <button
                        type="button"
                        className={classNames(
                          'relative flex h-full w-full items-center justify-center bg-white p-3 text-sm font-semibold text-gray-900 shadow-sm ring-inset ring-gray-700',
                          (col !== turn &&
                            !movableSquares.includes(
                              rowIndex * BOARD_COL + colIndex
                            )) ||
                            gameOver ||
                            botMoving
                            ? ''
                            : 'hover:bg-gray-100',
                          selected === rowIndex * BOARD_COL + colIndex
                            ? 'ring-4'
                            : 'ring-0'
                        )}
                        onClick={() => {
                          if (
                            selected !== null &&
                            movableSquares.includes(
                              rowIndex * BOARD_COL + colIndex
                            )
                          ) {
                            handleMove(
                              selected,
                              rowIndex * BOARD_COL + colIndex
                            )
                            return
                          }
                          setSelected((selected) => {
                            if (selected === rowIndex * BOARD_COL + colIndex) {
                              setMovableSquares([])
                              return null
                            }
                            setMovableSquares(
                              getMovableSquares(rowIndex, colIndex, col)
                            )
                            return rowIndex * BOARD_COL + colIndex
                          })
                        }}
                        onDragStart={() => {
                          setSelected(rowIndex * BOARD_COL + colIndex)
                          setMovableSquares(
                            getMovableSquares(rowIndex, colIndex, col)
                          )
                        }}
                        onDragOver={(e) => {
                          if (
                            movableSquares.includes(
                              rowIndex * BOARD_COL + colIndex
                            )
                          )
                            e.preventDefault()
                        }}
                        onDrop={() => {
                          if (
                            selected === null ||
                            selected === rowIndex * BOARD_COL + colIndex
                          )
                            return
                          handleMove(selected, rowIndex * BOARD_COL + colIndex)
                        }}
                        disabled={
                          (col !== turn &&
                            !movableSquares.includes(
                              rowIndex * BOARD_COL + colIndex
                            )) ||
                          gameOver ||
                          botMoving
                        }
                        draggable={col === turn && !gameOver && !botMoving}
                      >
                        {col === 'B' ? (
                          <BlackPawn className="-mt-1 h-10 w-10" />
                        ) : col === 'W' ? (
                          <WhitePawn className="-mt-1 h-10 w-10" />
                        ) : null}
                        <span className="sr-only">{col}</span>
                        <div
                          className={classNames(
                            'absolute rounded-full',
                            col === '_'
                              ? 'h-4 w-4 bg-gray-700'
                              : 'inset-0 m-1 border-4 border-gray-700',
                            movableSquares.includes(
                              rowIndex * BOARD_COL + colIndex
                            )
                              ? 'opacity-30'
                              : 'opacity-0'
                          )}
                        ></div>
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6">
            <div className="flex flex-col items-center space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
              <button
                type="button"
                className={classNames(
                  'w-full rounded-md bg-white py-2.5 px-3.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300',
                  botMoving
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:bg-gray-50'
                )}
                disabled={botMoving}
                onClick={() => resetGame()}
              >
                Reset
              </button>
              <button
                type="button"
                className={classNames(
                  'w-full rounded-md bg-white py-2.5 px-3.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300',
                  gameOver || botMoving
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:bg-gray-50'
                )}
                disabled={gameOver || botMoving}
                onClick={() => setBoard(invertBoard(board))}
              >
                Invert Board
              </button>
              <button
                type="button"
                className={classNames(
                  'w-full rounded-md bg-white py-2.5 px-3.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300',
                  gameOver || botMoving
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:bg-gray-50'
                )}
                disabled={gameOver || botMoving}
                onClick={() => setTurn((turn) => (turn === 'B' ? 'W' : 'B'))}
              >
                Switch Turn
              </button>
            </div>
          </div>
          <div className="mt-3">
            <button
              type="button"
              className={classNames(
                'w-full rounded-md bg-white py-2.5 px-3.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300',
                gameOver || botMoving
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:bg-gray-50'
              )}
              disabled={gameOver || botMoving}
              onClick={() => handleBotMove()}
            >
              Make Bot Move
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
