import sys
import uuid
from tqdm import tqdm
from pathlib import Path
from loguru import logger
import platform
from nomic.gpt4all import GPT4All
try:
    import torch
except ImportError:
    torch = None
    pass

class GPT4AllWeb(GPT4All):
    def prompt_callback(self, prompt, callback, write_to_stdout = False):
        """
        Write a prompt to the bot and return the response.
        """
        bot = self.bot
        continuous_session = self.bot is not None
        if not continuous_session:
            logger.warning("Running one-off session. For continuous sessions, use a context manager: `with GPT4All() as bot: bot.prompt('a'), etc.`")
            self.open()
        bot.stdin.write(prompt.encode('utf-8'))
        bot.stdin.write(b"\n")
        bot.stdin.flush()
        return_value = self._parse_to_prompt_callback(callback, write_to_stdout)
        if not continuous_session:
            self.close()
        return return_value

    def __print(c):
        sys.stdout.write(c)
        sys.stdout.flush()

    def _parse_to_prompt_callback(self, callback, write_to_stdout = True):
        id=f'{uuid.uuid4()}'
        callback("", "start", id)
        bot_says = ['']
        point = b''
        bot = self.bot
        while True:
            point += bot.stdout.read(1)
            try:
                character = point.decode("utf-8")
                if character == "\f": # We've replaced the delimiter character with this.
                    callback("", "end", id)
                    return "\n".join(bot_says)
                if character == "\n":
                    bot_says.append('')
                    GPT4AllWeb.__print('\n')
                    callback('\n', "response", id)
                else:
                    bot_says[-1] += character
                    GPT4AllWeb.__print(character)
                    callback(character, "response", id)
                point = b''

            except UnicodeDecodeError:
                if len(point) > 4:
                    point = b''