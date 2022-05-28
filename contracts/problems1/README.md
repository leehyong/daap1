# 解决问题1而编写的合约
第一版的合约，可以用这个合约往某些地址铸币、查询余额
## 安装依赖
`yarn install`

## 执行合约单元测试
`npx hardhat test test/token-test.js`

## 把合约部署到 Mumbai testnet
1. 需要在 `env`文件里配置**mumbai**以太网账户的私钥, 如(参考`.env.example`文件, 使用时，可以把`.env.example`文件重命名为`.env`文件):
```text
MUMBAI_URL=https://matic-mumbai.chainstacklabs.com
PRIVATE_OWNER=0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1
```
2. 执行命令部署到 **Mumbai testnet**
`npx hardhat run --network mumbai scripts/deploy-token.js`
   
注意部署到测试网络时，需要保证有 `Mumbai` 的测试币, 可以去网站[polygon](https://faucet.polygon.technology/)获取测试币
