import { Sepolia } from "@usedapp/core";

export const ROUTER_ADDRESS = "0x2c60bCCD6D20eaBce3C74956D3c08438D603762B";
export const FACTORY_ADDRESS = "0x99440BF07a7c23FD15fCFAa96b2957c905b8A6f5";
export const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
export const DAPP_CONFIG = {
  readOnlyChainId: Sepolia.chainId,
  readOnlyUrls: {
    [Sepolia.chainId]:
      "https://eth-sepolia.g.alchemy.com/v2/8UMz3MBTPnXvG8aop6kbIoVI2CxTdi2x",
  },
};
