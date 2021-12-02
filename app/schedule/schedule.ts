import { Subscription } from 'egg';
import LimitOrder from '../utils/limitOrder';
export default class tokenListMonitor extends Subscription {
  static get schedule() {
    return {
      interval: '10m',
      type: 'all',
      immediate: true,
    };
  }


  async subscribe() {
    // get all limit order, only query valid order
    const result = await LimitOrder.list({ limit: 100, statuses: [ 1 ] });
    if (result.code !== 200) return result;

    // orderList []
    const orderList = result.data;
    orderList.forEach(async limitOrder => {
      // limitOrder format
    //   {
    //     "makerAmount": "1000000000000000000",
    //     "takerAmount": "1000000000000000000",
    //     "signature": "0xcee0f00780a15e345ebdeb5370efebc55b771c4515a006df899d79e979cd55967ac370d23c96e5fc4401f47c142d1ca29a1a3a43bdf6799858a64a533be35a9c1c",
    //     "orderHash": "0x1f7c80c24d2cbed76de6279b2dd53eaa7d5047c9e274e86150acc015148f450e",
    //     "createDateTime": "2021-10-21T11:01:23.000Z",
    //     "orderMaker": "0x72f16Cae8F50Ad615AB5A8e231A496b2ace52532",
    //     "remainingMakerAmount": "1000000000000000000",
    //     "makerBalance": null,
    //     "makerAllowance": null,
    //     "expireTime": 1641953173,
    //     "data": {
    //         "makerAsset": "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
    //         "takerAsset": "0x55d398326f99059ff775485246999027b3197955",
    //         "getMakerAmount": "0xf4a215c30000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000de0b6b3a7640000",
    //         "getTakerAmount": "0x296637bf0000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000de0b6b3a7640000",
    //         "makerAssetData": "0x23b872dd00000000000000000000000072f16cae8f50ad615ab5a8e231a496b2ace5253200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b6b3a7640000",
    //         "takerAssetData": "0x23b872dd000000000000000000000000000000000000000000000000000000000000000000000000000000000000000072f16cae8f50ad615ab5a8e231a496b2ace525320000000000000000000000000000000000000000000000000de0b6b3a7640000",
    //         "salt": "530659656311",
    //         "permit": "0x",
    //         "predicate": "0x961d5b1e000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000001000000000000000000000000e0b3c4a46b4f0d6a77fc58eb09e04b0365289dad00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002463592c2b00000000000000000000000000000000000000000000000000000000617a704000000000000000000000000000000000000000000000000000000000",
    //         "interaction": "0x"
    //     },
    //     "makerRate": null,
    //     "takerRate": null
    // }

      // user want to buy makerAmount, must less than remainingMakerAmount
      limitOrder.buyAmount = 1000000000000000000;

      // The developer set the order logic, maker sure you want to order; You can use our api, or send transaction buy your code
      const result = await LimitOrder.fillLimitOrder(limitOrder);
      if (result.code !== 200) {
        // you can check fail reason! such as timeout, not sufficient funds
        console.log('fill order fail: ', result.error);
      } else {
        // you can check by hash on chain!
        console.log('success: ', result);
      }
    });
  }

}
