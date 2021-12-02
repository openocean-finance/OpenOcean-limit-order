import { pkgReq } from '../utils/req';
import BigNumber from 'bignumber.js';
import config from '../../config/config.json';
import { LimitOrderProtocolFacade, PrivateKeyProviderConnector } from '@1inch/limit-order-protocol';
import Web3 from 'web3';
const url = config.url;
const rpcUrl = config.rpcUrl;
const privateKey = config.fillPrivateKey;
const LIMIT_CONTRACT_ADDRESS = config.limit_contract_address;
const account = config.fillAccount;
const abi = config.abi;
const chainId = 56;

/**
 * Limit Order Service
 */
export default class LimitOrder {

  /**
   * Get all limit orders
   * chainId: 1/56/137/43114
   * params {limit: 10, status: params[1,2,3] }
   */
  static async list(params: any) {
    const [ err, data ] = await pkgReq(url + `/v1/${chainId}/limit-order/all`, params, { 'Content-Type': 'application/json' });
    if (err) return { code: 500, error: 'fail' };
    return data;
  }


  static async fillLimitOrder(params: any) {
    const checkResult = await LimitOrder.prototype.checkLimitOrder(params);
    if (checkResult) return { code: 500, error: `checkLimitOrder fail: ${checkResult}` };

    const myWallet = LimitOrder.prototype.createMyWallet(privateKey);
    const approveResult = await LimitOrder.prototype.approve(params.takerAmount, params.data.takerAsset, myWallet);
    if (approveResult) return { code: 500, error: `approve fail:  ${approveResult}` };

    const callData = LimitOrder.prototype.getCallData(myWallet, privateKey, params);

    return await LimitOrder.prototype.sendTransaction(callData, myWallet);
  }


  // create your wallet
  public createMyWallet(privateKey): any {
    const provider = new Web3.providers.HttpProvider(rpcUrl, { timeout: 30000 });
    const web3 = new Web3(provider);
    web3.eth.accounts.wallet.add(privateKey);
    return web3;
  }

  public getCallData(myWallet, privateKey, params): any {
    const connector = new PrivateKeyProviderConnector(privateKey.indexOf('0x') > -1 ? privateKey.substr(2) : privateKey, myWallet);
    const limitOrderProtocolFacade = new LimitOrderProtocolFacade(LIMIT_CONTRACT_ADDRESS, connector);
    const { data, signature, buyAmount } = params;
    const limitOrder = data;
    const callData = limitOrderProtocolFacade.fillLimitOrder(
      limitOrder,
      signature,
      buyAmount,
      '0',
      new BigNumber('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff').toFixed(0, 1),
    );

    return callData;
  }

  public async checkLimitOrder(params: any) {
    const { expireTime, buyAmount, data, orderMaker } = params;
    const { makerAsset } = data;
    const balance = await this.getBalanceByEthers({ inTokenAddress: makerAsset, account: orderMaker, chainId });
    if (balance < buyAmount) return `Insufficient balance, balance is ${balance}, but you want buy ${buyAmount}`;
    if (Date.now() / 1000 > expireTime) return `timeout:  ${expireTime}`;
    return null;
  }

  public async getBalanceByEthers(params) {
    // result
    //   {
    //     "code": 200,
    //     "data": [
    //         {
    //             "symbol": "OOE",
    //             "balance": 6.2638101194166,
    //             "raw": 6263810119416600000
    //         }
    //     ]
    // }
    // If you're getting multiple token balances, you need to iterate data
    const [ err, result ] = await pkgReq(url + '/v1/cross/getBalance', params, { 'Content-Type': 'application/json' });
    if (err) return 0;
    if (result.data && result.data[0].raw) return result.data.raw;
    return 0;
  }

  public async approve(amount: string, tokenAddress: string, myWallet) {
    const contract = new myWallet.eth.Contract(abi, tokenAddress);
    let approveAmount = await contract.methods.allowance(account, LIMIT_CONTRACT_ADDRESS).call();
    if (approveAmount > amount) {
      return null;
    }
    approveAmount = new BigNumber('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff').toFixed(0, 1);
    const gasAmount = await contract.methods.approve(LIMIT_CONTRACT_ADDRESS, approveAmount).estimateGas({
      from: account,
    });
    try {
      await contract.methods.approve(LIMIT_CONTRACT_ADDRESS, approveAmount).send({
        from: account,
        gasPrice: 5000000000, // you can define by your self
        gas: 210000 || gasAmount, // you can define by your self, or use gasAmount
      });
      return null;
    } catch (error) {
      return error;
    }
  }

  public async sendTransaction(callData, myWallet) {
    const swapParams = {
      from: account,
      to: LIMIT_CONTRACT_ADDRESS,
      data: callData,
      gas: 210000,
      gasPrice: 5000000000,
    };
    try {
      const result = await myWallet.eth.sendTransaction(swapParams);
      if (result && result.transactionHash) {
        return { code: 200, data: { hash: result.transactionHash } };
      }
      return { code: 500, error: `sendTransaction fail: ${result}` };
    } catch (error) {
      return { code: 500, error: `sendTransaction fail: ${error}` };
    }
  }
}

