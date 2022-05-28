# 解决问题3而编写的合约
1. 遵循**ERC1155**标准的合约
2. **UUPS**模式升级已经编写的合约
3. 支持*铸币、支付、批量支付、查询余额、赎回、根据合约发出的事件自动更新余额*
4. **Vue3**编写前端代码

## 安装依赖
`yarn install`

## 执行合约单元测试
    ```
    npx hardhat test test/erc1155-token-test.js
    npx hardhat test test/erc1155-token-redeem-test.js
    ```

## 把合约部署到 Mumbai testnet
1. 需要在 `env`文件里配置**mumbai**以太网账户的私钥, 如(参考`.env.example`文件, 使用时，可以把`.env.example`文件重命名为`.env`文件):
    ```text
    MUMBAI_URL=https://matic-mumbai.chainstacklabs.com
    PRIVATE_OWNER=0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1
    ```
2. 执行命令部署到 **Mumbai testnet**
    * `npx hardhat run --network mumbai scripts/deploy-pay-redeem.js`
    
注意部署到测试网络时，需要保证有 `Mumbai` 的测试币, 可以去网站[polygon](https://faucet.polygon.technology/)获取测试币

## 启动前端服务
```
cd frontend
yarn install
yarn run dev
```