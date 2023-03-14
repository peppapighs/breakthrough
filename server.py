from flask import Flask, request
from flask_cors import CORS

# Uncomment the line below and rename 'agent' to the file containing your AI
# from agent import PlayerAI

import json

app = Flask(__name__)


@app.route("/", methods=["POST"])
def make_move():
    board = json.loads(request.data)
    return list(PlayerAI().make_move(board))


CORS(app)
app.run(debug=True)
