from entity import Entity


class Bank(Entity):
    def __init__(self, private_key):
        super().__init__(private_key)


if __name__ == '__main__':
    print("DO NOT RUN THIS FILE")
    exit(1)
