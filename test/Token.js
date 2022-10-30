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
const { ethers } = require('hardhat');
const { experimentalAddHardhatNetworkMessageTraceHook } = require('hardhat/config');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')	
}

describe('Token', () =>{
    let token, accounts, deployer, receiver, exchange

    beforeEach(async () => {
        const Token = await ethers.getContractFactory('Token')
        token = await Token.deploy('Sahil', 'SHL', '1000000')

        accounts = await ethers.getSigners()
        deployer = accounts[0]
        receiver = accounts[1]
        exchange = accounts[2]
    })

    describe('Deployment', () => {
        const name = 'Sahil'
        const symbol = 'SHL'
        const decimals = '18'
        const totalSupply = tokens('1000000')

    it('Has Correct Name', async () => {
       expect(await token.name()).to.equal(name)
    })

    it('Has Correct Symbol', async () => {
        expect(await token.symbol()).to.equal(symbol)
    })

    it('Has Correct Decimals', async () => {
        expect(await token.decimals()).to.equal(decimals)
    })

    it('Has Correct Supply', async () => {
        expect(await token.totalSupply()).to.equal(totalSupply)
    })

    it('Assigns Total Supply to Deployer', async () => {
        expect(await token.balanceOf(deployer.address)).to.equal(totalSupply)
    })
})

    describe('Sending Tokens', () => {
        let amount, transaction, result

        describe('Success', () => {

        beforeEach(async () => {
            amount = tokens(100)
            transaction = await token.connect(deployer).transfer(receiver.address, amount) 
            result = await transaction.wait()
        })
        it('Transfer Token Balances', async () => {

            expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900))
            expect(await token.balanceOf(receiver.address)).to.equal(amount)

        })
        it('Emits a Transfer Event', async () => {

            const event = result.events[0]
            expect(event.event).to.equal('Transfer')
            const args = event.args
            expect(args.from).to.equal(deployer.address)
            expect(args.to).to.equal(receiver.address)
            expect(args.value).to.equal(amount)
   
        }) 
    })	
    describe('Failure', () => {
        it('Rejects Insufficient balance', async () => {
            const invalidAmount = tokens(1000000000)
            await expect(token.connect(deployer).transfer(receiver.address, invalidAmount)).to.be.reverted

        })
        it('Rejects Invalid Recipient', async () => {
            const amount = tokens(100)
            await expect(token.connect(deployer).transfer('0x0000000000000000000000000000000000000000', amount)).to.be.reverted
        })
    })
        describe('Approving Tokens', () => {
        let amount, transaction, result

        beforeEach(async () => {
            amount = tokens(100)
            transaction = await token.connect(deployer).approve(exchange.address, amount) 
            result = await transaction.wait()
        })

        describe('Success', () => {
            it('Allocates and Allowance for delegated token spending', async () => {
                expect(await token.allowance(deployer.address, exchange.address)).to.equal(amount)
            })

            it('Emits an Approval Event', async () => {

                const event = result.events[0]
                expect(event.event).to.equal('Approval')
                const args = event.args
                expect(args.owner).to.equal(deployer.address)
                expect(args.spender).to.equal(exchange.address)
                expect(args.value).to.equal(amount) 
       
            })
        

        describe('Failure', () => {
            it('Rejects Invalid Spenders', async () => {
                await expect(token.connect(deployer).approve('0x0000000000000000000000000000000000000000', amount)).to.be.reverted
            })
        })
    })	
}) 
        describe('Delegated Tokens Transfer', () => {
            let amount, transaction, result

        beforeEach(async () => {
            amount = tokens(100)
            transaction = await token.connect(deployer).approve(exchange.address, amount) 
            result = await transaction.wait()
        })
            describe('Success', () => {
                beforeEach(async () => {
                    transaction = await token.connect(exchange).transferFrom(deployer.address, receiver.address, amount)
                    result = await transaction.wait()
                })
                it('Transfer Token balances', async() => {
                    expect(await token.balanceOf(deployer.address)).to.be.equal(ethers.utils.parseUnits("999900", "ether"))
                    expect(await token.balanceOf(receiver.address)).to.be.equal(amount)
                })
                it("Resets the Allowance", async () => {
                    expect(await token.allowance(deployer.address, exchange.address)).to.be.equal(0)
                })
                it('Emits a Transfer Event', async () => {

                    const event = result.events[0]
                    expect(event.event).to.equal('Transfer')
                    const args = event.args
                    expect(args.from).to.equal(deployer.address)
                    expect(args.to).to.equal(receiver.address)
                    expect(args.value).to.equal(amount)
           
                })
            })

            describe('Failure', () => {
                it('Rejects Insufficient Amounts', async () => {
                    const invalidAmount = tokens(100000000)
                    await expect(token.connect(exchange).transferFrom(deployer.address, receiver.address, invalidAmount)).to.be.reverted
                })

            })

        })
    })
})

