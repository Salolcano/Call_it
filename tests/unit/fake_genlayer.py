"""Minimal in-memory stand-in for the genlayer SDK so contracts/call_it.py can be
executed by plain pytest (no GenVM). Direct-mode tests in tests/direct use the real VM."""
import sys, types, typing, importlib.util, pathlib


class UserError(Exception):
    pass


class Address:
    def __init__(self, v):
        self.as_hex = v.as_hex if hasattr(v, "as_hex") else str(v)


class TreeMap(dict):
    pass


class _Deco:
    def __call__(self, fn):
        return fn

    payable = staticmethod(lambda fn: fn)


class World:
    def __init__(self):
        self.sender = Address("0xA11CE")
        self.value = 0
        self.page = None  # str, or Exception to raise
        self.llm = ""  # str returned by exec_prompt, or Exception
        self.prompts = []
        self.transfers = []


def load(world: World):
    gl = types.SimpleNamespace()

    class Contract:
        def __new__(cls, *a, **k):
            obj = object.__new__(cls)
            for name, ann in getattr(cls, "__annotations__", {}).items():
                if typing.get_origin(ann) is TreeMap or ann is TreeMap:
                    setattr(obj, name, TreeMap())
            return obj

    def contract_interface(c):
        class Bound:
            def __init__(self, addr):
                self.addr = addr

            def emit_transfer(self, value):
                world.transfers.append((self.addr.as_hex, int(value)))

        return Bound

    def render(url, mode="text"):
        if isinstance(world.page, Exception):
            raise world.page
        return world.page

    def exec_prompt(prompt):
        world.prompts.append(prompt)
        if isinstance(world.llm, Exception):
            raise world.llm
        return world.llm

    gl.Contract = Contract
    gl.public = types.SimpleNamespace(write=_Deco(), view=lambda fn: fn)
    gl.evm = types.SimpleNamespace(contract_interface=contract_interface)
    gl.vm = types.SimpleNamespace(UserError=UserError)
    gl.nondet = types.SimpleNamespace(
        web=types.SimpleNamespace(render=render), exec_prompt=exec_prompt
    )
    gl.eq_principle = types.SimpleNamespace(strict_eq=lambda fn: fn())
    class _Msg:
        sender_address = property(lambda s: world.sender)
        value = property(lambda s: world.value)

    gl.message = _Msg()

    mod = types.ModuleType("genlayer")
    mod.gl, mod.Address, mod.TreeMap, mod.u256 = gl, Address, TreeMap, int
    sys.modules["genlayer"] = mod
    path = pathlib.Path(__file__).resolve().parents[2] / "contracts" / "call_it.py"
    spec = importlib.util.spec_from_file_location("call_it_under_test", path)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m
