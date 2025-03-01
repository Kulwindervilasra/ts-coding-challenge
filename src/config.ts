export interface Account {
  id: string, privateKey: string, initialBalance: number;
}

export const accounts: Account[] = [
  { id: "0.0.5636460", privateKey: "3030020100300706052b8104000a04220420f0158e56e727e5a532d8be186e9dfe34b43c63b17be807a4bb05879f4550724b", initialBalance: 10 },
  { id: "0.0.5636525", privateKey: "3030020100300706052b8104000a04220420bd657f44c8f5f8c2a10ec272890e01bde171983682ad722f32d3218dcd8347f8", initialBalance: 10 },
  { id: "0.0.5636541", privateKey: "3030020100300706052b8104000a04220420c5ce05763d7c807775830b6a91d1863bd858cc7e01c7f56a56c96171ec7a3030", initialBalance: 10 },
  { id: "0.0.5636547", privateKey: "3030020100300706052b8104000a0422042069db92aee3defb4b34cccf84cb5b889949d77b332c242be6ef49dbed9710f8c1", initialBalance: 10 },
]

