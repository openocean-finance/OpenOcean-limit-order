import axios from 'axios';

export const pkgReq = async (reqUrl: string, params: any, headers?:any): Promise<any> => {
  try {
    const result = await axios({
      url: reqUrl,
      method: 'GET',
      headers,
      responseType: 'json',
      params,
    });
    return [ null, result && result.data ? result.data : result ];
  } catch (error) {
    return [ error ];
  }
};
