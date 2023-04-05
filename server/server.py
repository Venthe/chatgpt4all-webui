import asyncio
import sys
from websockets.server import serve
import json
from prompt_parser import GPT4AllWeb
import nest_asyncio
import uuid

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
                correlation_id=f'{uuid.uuid4()}'
                async def send_coroutine(prompt, payload, type, correlation_id):
                    sys.stdout.write(payload)
                    sys.stdout.flush()
                    response = {"type": type, "payload": payload, "correlationId": correlation_id, "prompt": prompt}
                    await websocket.send(json.dumps(response))
                callback = lambda x:message_loop.run_until_complete(send_coroutine(m["prompt"], x, 'response', correlation_id))
                bot.prompt_callback(m["prompt"], callback = callback)
    print("Bot opened")
    async with serve(echo, host, port):
        try:
            await event_loop.create_future()  # run forever
        finally:
            print('closing event loop')
            event_loop.close()

asyncio.run(main())