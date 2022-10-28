/*const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Token', () => {

	it('has correct name', async () =>{
		//fetch token name from blockchain
		const Token = await ethers.getContractFactory('Token')
		let token = await Token.deploy()
		//read token name
		const name = await token.name()
		//checks if that name is correct
		expect(name).to.equal('Sahil')
	})

	it('has correct symbol', async () =>{
		const Token = await ethers.getContractFactory('Token')
		let token = await Token.deploy()
		const symbol = await token.symbol()
		expect(symbol).to.equal('SHL')
	})
})*/
const { expect } = require('chai');
const { ethers } = require('hardhat')

const tokens = (n) => {
	return ethers.utils.parseUnits(n.toString(), 'ether')	
}

describe('Token', () =>{
	let token

	beforeEach(async () => {
		const Token = await ethers.getContractFactory('Token')
		token = await Token.deploy('Sahil', 'SHL', '1000000')
	})

	describe('Deployment', () => {
		const name = 'Sahil'
		const symbol = 'SHL'
		const decimals = '18'
		const totalSupply = tokens('1000000')

	it('has correct name', async () =>{
	   expect(await token.name()).to.equal(name)
	})

	it('has correct symbol', async () =>{
		expect(await token.symbol()).to.equal(symbol)
	})

	it('has correct decimals', async () =>{
		expect(await token.decimals()).to.equal(decimals)
	})

	it('has correct supply', async () =>{
		expect(await token.totalSupply()).to.equal(totalSupply)
	})

  })

})