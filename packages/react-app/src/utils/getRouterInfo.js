import { abis } from "@my-app/contracts";

export const getRouterInfo = async (routerAddress, web3) => {
  const router = new web3.eth.Contract(abis.router01, routerAddress);

  return {
    factory: await router.methods.getFactoryAddress().call(),
  };
};
