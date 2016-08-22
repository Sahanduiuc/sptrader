import cffi
import os
import sys
import time
import threading

location = os.path.dirname(os.path.realpath(__file__))
sys.path.insert(0, location)
sys.path.insert(0, os.path.join(location, "..", "sptrader"))

import sptrader
import config
import cffi_to_dict

cv = threading.Condition()
login = config.logininfo;
sp = sptrader.SPTrader()
sp.set_login_info(login['host'],
                  8080,
                  login['license'],
                  login['app_id'],
                  login['user_id'],
                  "test1")

@sp.ffi.callback("ApiTickerUpdateAddr")
def ticker_action(data):
    print("Ticker")

@sp.ffi.callback("ConnectedReplyAddr")
def connected_reply_func(host_type, con_status):
    print("connected", host_type, con_status)

@sp.ffi.callback("AccountInfoPushAddr")
def account_info_func(data):
    print("Account")
    print(cffi_to_dict.convert_to_python(sp.ffi, data[0]))

@sp.ffi.callback("InstrumentListReplyAddr")
def instrument_list_reply_func(is_ready, ret_msg):
    print("InstrumentListReply")
    print(sp.ffi.string(ret_msg))
    print(sp.api.SPAPI_GetInstrumentCount());

@sp.ffi.callback("ApiPriceUpdateAddr")
def api_price_update_func(data):
    print("api_price_update")
    print(cffi_to_dict.convert_to_python(sp.ffi, data[0]))

@sp.ffi.callback("LoginReplyAddr")
def login_actions(ret_code, ret_msg):
    print("login")
    print(login['user_id'].encode("utf-8"))
    user = sp.ffi.new("char[]", login['user_id'].encode("utf-8"))
    print(user)
    price = sp.ffi.new("SPApiPrice[1]")
    print("price", sp.api.SPAPI_GetPriceByCode(user, b"HSIQ6", price))
    print(price[0].Close)
    print(sp.api.SPAPI_GetAccBalCount(user))
    print(sp.api.SPAPI_SubscribePrice(user, b"HSIQ6", 1))
    print(sp.api.SPAPI_SubscribeTicker(
        user,
        b"HSIQ6", 1))
    print(sp.api.SPAPI_GetInstrumentCount());
    print(sp.api.SPAPI_GetProductCount());


sp.register_login_reply(login_actions)
sp.register_account_info_push(account_info_func)
sp.register_connecting_reply(connected_reply_func)
sp.register_instrument_list_reply(instrument_list_reply_func)
sp.api.SPAPI_RegisterApiPriceUpdate(api_price_update_func)
sp.api.SPAPI_RegisterTickerUpdate(ticker_action)
print("instrument_list", sp.api.SPAPI_LoadInstrumentList());
print(sp.login())
input("Press any key to exit")
sp.logout()
