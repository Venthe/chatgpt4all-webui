import asyncio
from websockets.server import serve
import json
from prompt_parser import GPT4AllWeb
import nest_asyncio

nest_asyncio.apply()
    
host="localhost"
port=8765

event_loop = asyncio.get_event_loop()
message_loop = asyncio.new_event_loop()

async def main():
    print("Starting server: " +host + ":" +str(port))
    bot = GPT4AllWeb(model="gpt4all-lora-unfiltered-quantized")
    bot.open()
    async def echo(websocket):
        async for message in websocket:
            print("Received message " + str(message))
            m=json.loads(message)
            if (m["type"] == 'prompt'):
                async def send_coroutine(prompt, payload, type, correlation_id):
                    response = {"type": type, "payload": payload, "correlationId": correlation_id, "prompt": prompt}
                    await websocket.send(json.dumps(response))
                callback = lambda x,u,w:message_loop.run_until_complete(send_coroutine(m["prompt"], x,u,w))
                bot.prompt_callback(m["prompt"], callback = callback)
    print("Bot opened")
    async with serve(echo, host, port):
        try:
            await event_loop.create_future()  # run forever
        finally:
            print('closing event loop')
            event_loop.close()

asyncio.run(main())














# from flask import Flask, render_template, redirect, url_for
# from flask_bootstrap import Bootstrap5

# from flask_wtf import FlaskForm, CSRFProtect
# from wtforms import TextAreaField, SubmitField
# from wtforms.validators import DataRequired, Length
# from flask import Flask
# from flask_socketio import SocketIO
# from flask_socketio import send, emit
# import secrets

# app = Flask(__name__, static_folder='app', static_url_path="/app")
# app.secret_key = secrets.token_urlsafe(16)
# socketio = SocketIO(app)

# # Bootstrap-Flask requires this line
# bootstrap = Bootstrap5(app)
# # Flask-WTF requires this line
# csrf = CSRFProtect(app)

# if __name__ == '__main__':
#     socketio.run(app)

# class NameForm(FlaskForm):
#     prompt = TextAreaField('Prompt', validators=[DataRequired(), Length(0, 300)])
#     submit = SubmitField('Submit')

# @app.route("/heartbeat")
# def heartbeat():
#     return jsonify({"status": "healthy"})


# @app.route('/', defaults={'path': ''})
# @app.route('/<path:path>')
# def catch_all(path):
#     return app.send_static_file("index.html")

# @app.route('/', methods=['GET', 'POST'])
# def index():
#     form = NameForm()
#     message = ""
#     prompt = ""
#     if form.validate_on_submit():
#         prompt = form.prompt.data
#         message = prompt
#         # socketio.emit('result', prompt)
#         # if name.lower() in names:
#         #     # empty the form field
#         #     form.name.data = ""
#         #     id = get_id(ACTORS, name)
#         #     # redirect the browser to another route and template
#         #     return redirect( url_for('actor', id=id) )
#         # else:
#         #     message = "That actor is not in our database."
#     return render_template('index.html', prompt=prompt, form=form, message=message)

# # @socketio.on('result')
# # def handle_message(data):
# #     print('received message')
# #     print(data)


