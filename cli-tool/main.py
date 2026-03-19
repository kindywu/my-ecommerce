from fontTools.subset import Subsetter, Options
from fontTools.ttLib import TTFont

text = "订单收货地址商品明细价格运费实付金额待付款付款成功商家发货确认收货已完成已取消已退款省市区详细地址收件人电话免运费提交支付发货完成取消退款下单时间生成支付宝微信感谢您的购买"

font = TTFont("/home/kindy/ws/node/my-ecommerce/public/fonts/NotoSansSC-Regular.ttf")
options = Options()
subsetter = Subsetter(options=options)
subsetter.populate(text=text)
subsetter.subset(font)
font.save("/tmp/NotoSansSC-subset.ttf")
print("Done")