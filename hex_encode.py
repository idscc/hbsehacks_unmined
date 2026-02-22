import asyncio

from xrpl.asyncio.clients import AsyncWebsocketClient
from xrpl.models import Subscribe, StreamParameter

URL = "wss://s.altnet.rippletest.net:51233"


def on_open():
    print("I have opened a connection!")


async def on_message(client):
    async for message in client:
        # do something with a message - we'll just print
        print(message)


def on_close():
    print("I have closed a connection cleanly!")


def on_error():
    print("An error occurred!")


async def main():
    # we'll use this to determine if the websocket closed cleanly or
    # not
    error_happened = False

    async with AsyncWebsocketClient(URL) as client:
        try:
            # here you'll run any code that should happen immediately
            # after the connection is made. this is equivalent to the
            # javascript 'open' event
            on_open()

            # set up the `on_message` function as a Task
            # so that it doesn't wait for a response, but
            # will "awaken" whenever the `asyncio` event
            # loop toggles to it. this is equivalent to the javascript
            # 'message' event
            asyncio.create_task(on_message(client))

            # now, the `on_message` function will run as if
            # it were "in the background", doing whatever you
            # want as soon as it has a message.

            # now let's subscribe to something. in this case,
            # we can just use `send` instead of `request`
            # because we don't really care about the response
            # since the `on_message` handler will also get it.
            await client.send(Subscribe(
                streams=[StreamParameter.LEDGER],
            ))
            print("Subscribed to the ledger!")

            # in the meantime, you can continue to do whatever
            # you want and the python `asyncio` event loop
            # will toggle between your code and the listener
            # as messages are ready. let's just sleep. note,
            # you need to use `asyncio.sleep` within
            # async code instead of `time.sleep`, otherwise
            # you will block all the waiting tasks instead of
            # just this code path.
            await asyncio.sleep(50)

            # now that we're done, we can unsubscribe if
            # we like
            # await client.send(Unsubscribe(
            #     streams=[StreamParameter.LEDGER],
            # ))
            # print("Unsubscribed from the ledger!")
        except:
            # if you wish you perform some logic when the websocket
            # connection closes due to error, you can catch and run
            # whatever you need to here. this is equivalent to the
            # javascript 'error' event
            error_happened = True
            on_error()
    # now, outside of the context, the client is closed.
    # the `on_message` task will now never receive a new message. you
    # can now run any code you need to run after the connection is
    # closed. this is equivalent to the javascript 'close' event
    if not error_happened:
        on_close()


if __name__ == "__main__":
    # remember to run your entire program within a
    # `asyncio.run` call.
    asyncio.run(main())
