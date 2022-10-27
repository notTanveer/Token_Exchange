async function main() {
    const Token = await ethers.getContractFactory("Token")
    const token = await Token.deploy()
    await token.deployed()
    console.log(`Deployed Token to: ${token.address}`)
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
