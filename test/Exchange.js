const { expect } = require('chai');
const { ethers } = require('hardhat');
const { TASK_COMPILE_SOLIDITY_RUN_SOLC, TASK_COMPILE_SOLIDITY_GET_ARTIFACT_FROM_COMPILATION_OUTPUT } = require('hardhat/builtin-tasks/task-names');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')	
}

describe('Exchange', () =>{
    let deployer, feeAccount, exchange, token1, user1, token2

    const feePercent = 10

    beforeEach(async () => {
        const Exchange = await ethers.getContractFactory('Exchange')
        const Token = await ethers.getContractFactory('Token')

        token1 = await Token.deploy('Sahil', 'SHL', '1000000')
        token2 = await Token.deploy('mock DAI', 'mDAI', '1000000')

        accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]
        user1 = accounts[2]
        user2 = accounts[3]

        let transaction = await token1.connect(deployer).transfer(user1.address, tokens(100))
        exchange = await Exchange.deploy(feeAccount.address, feePercent)
    })

    describe('Deployment', () => {
 
        it('Tracks the Fee Account', async () => {
            expect(await exchange.feeAccount()).to.equal(feeAccount.address)
        })

        it('Tracks the Fee Percent', async () => {
            expect(await exchange.feePercent()).to.equal(feePercent)
        })
    })

    describe('Depositing Tokens', () => {
        let transaction, result
        let amount = tokens(10)

        beforeEach(async () => {
            //Approve Token
          transaction = await token1.connect(user1).approve(exchange.address, amount)
          result = await transaction.wait()
          //Deposit Token
          transaction = await exchange.connect(user1).depositToken(token1.address, amount)            
          result = await transaction.wait()
        })

        describe('Success', () => {
            it('Tokens Deposited', async () => {
                expect(await token1.balanceOf(exchange.address)).to.equal(amount)                
                expect(await exchange.tokens(token1.address, user1.address)).to.equal(amount)
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
            }) 
            it('Emits a Deposit Event', async () => {

                const event = result.events[1]
                expect(event.event).to.equal('Deposit')
                const args = event.args
                expect(args.token).to.equal(token1.address)
                expect(args.user).to.equal(user1.address)
                expect(args.amount).to.equal(amount)
                expect(args.balance).to.equal(amount)
            })
        })

        describe('Failure', () => {
            it('Fails when no tokens approved', async () => {
                await expect(exchange.connect(user1).depositToken(token1.address, amount)).to.be.reverted
            })
        })
    })

    describe('Withdrawing Tokens', () => {
        let transaction, result
        let amount = tokens(10)

        describe('Success', () => {

            beforeEach(async () => {
                //Deposit tokens before withdrawing
                //Approve Token
              transaction = await token1.connect(user1).approve(exchange.address, amount)
              result = await transaction.wait()
              //Deposit Token
              transaction = await exchange.connect(user1).depositToken(token1.address, amount)            
              result = await transaction.wait()
              //Withdraw Tokens
              transaction = await exchange.connect(user1).withdrawToken(token1.address, amount)            
              result = await transaction.wait()
            })

            it('Withdraw Token Funds', async () => {
                expect(await token1.balanceOf(exchange.address)).to.equal(0)                
                expect(await exchange.tokens(token1.address, user1.address)).to.equal(0)
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(0)
            }) 
            it('Emits a Withdraw Event', async () => {

                const event = result.events[1]
                expect(event.event).to.equal('Withdraw')
                const args = event.args
                expect(args.token).to.equal(token1.address)
                expect(args.user).to.equal(user1.address)
                expect(args.amount).to.equal(amount)
                expect(args.balance).to.equal(0)
            })
        })

        describe('Failure', () => {
            it('Fails for Isufficient Balance', async () => {
                await expect(exchange.connect(user1).depositToken(token1.address, amount)).to.be.reverted
            })
        })
})

    describe('Checking Balance', () => {
        let transaction, result
        let amount = tokens(1)

        beforeEach(async () => {
          //Approve Token
          transaction = await token1.connect(user1).approve(exchange.address, amount)
          result = await transaction.wait()
          //Deposit Token
          transaction = await exchange.connect(user1).depositToken(token1.address, amount)            
          result = await transaction.wait()
        })
        it('Returns User Balance', async () => {
          expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
     }) 
   })
   describe('Making Orders', async () => {

       let transaction, result

       let amount = tokens(1)

    describe('Success', async () => {
        beforeEach(async() => {
           //Deposit before making an order
          //Approve Token
          transaction = await token1.connect(user1).approve(exchange.address, amount)
          result = await transaction.wait()
          //Deposit Token
          transaction = await exchange.connect(user1).depositToken(token1.address, amount)            
          result = await transaction.wait()
          //Make Order
          transaction = await exchange.connect(user1).makeOrder(token2.address, tokens(1), token1.address, tokens(1))
          result = await transaction.wait()
        })

        it('Tracks newly created orders', async () => {
            expect(await exchange.orderCount()).to.equal(1)
        })

        it('Emits an Order event', async () => {
            const event = result.events[0]
            expect(event.event).to.equal('Order')

            const args = event.args
            expect(args.id).to.equal(1)
            expect(args.user).to.equal(user1.address)
            expect(args.tokenGet).to.equal(token2.address)
            expect(args.amountGet).to.equal(tokens(1))
            expect(args.tokenGive).to.equal(token1.address)
            expect(args.amountGive).to.equal(tokens(1))
            expect(args.timestamp).to.at.least(1)
        })
    })
    describe('Failure', async () => {
        it('Rejects With no Balance', async () => {
            expect(exchange.connect(user1).makeOrder(token2.address, tokens(1), token1.address, tokens(1))).to.be.reverted
        })
    })
  })

  describe('Order Actions', async () => {
    let transaction, result
    let amount = tokens(1)

    beforeEach(async () => {
        //Approve Token
        transaction = await token1.connect(user1).approve(exchange.address, amount)
        result = await transaction.wait()
        //Deposit Token
        transaction = await exchange.connect(user1).depositToken(token1.address, amount)            
        result = await transaction.wait()
        //Make Order
        transaction = await exchange.connect(user1).makeOrder(token2.address, tokens(1), token1.address, tokens(1))
        result = await transaction.wait()
      })

    describe('Cancelling Orders', async () => {

        describe('Success', async () => {
            beforeEach(async () => {
                transaction = await exchange.connect(user1).cancelOrder(1);
                result = await transaction.wait();
            })
            it('Updates Cancelled Orders', async () => {
                expect(await exchange.orderCancelled(1)).to.equal(true)
            })
            it('Emits a Cancel event', async () => {
                const event = result.events[0]
                expect(event.event).to.equal('Cancel')
    
                const args = event.args
                expect(args.id).to.equal(1)
                expect(args.user).to.equal(user1.address)
                expect(args.tokenGet).to.equal(token2.address)
                expect(args.amountGet).to.equal(tokens(1))
                expect(args.tokenGive).to.equal(token1.address)
                expect(args.amountGive).to.equal(tokens(1))
                expect(args.timestamp).to.at.least(1)
            }) 
        })

        describe('Failure', async () => {
          beforeEach(async () => {
        //Approve Token
        transaction = await token1.connect(user1).approve(exchange.address, amount)
        result = await transaction.wait()
        //Deposit Token
        transaction = await exchange.connect(user1).depositToken(token1.address, amount)            
        result = await transaction.wait()
        //Make Order
        transaction = await exchange.connect(user1).makeOrder(token2.address, amount , token1.address, amount)
        result = await transaction.wait()
          })
            it('Rejects Invalid Order ID', async () => {
              const invalidOrderID = 99999
               await expect(exchange.connect(user1).cancelOrder(invalidOrderID)).to.be.reverted
            })
            it('Rejects Unauthorized Cancellations', async () => {
              await expect(exchange.connect(user2).cancelOrder(1)).to.be.reverted
            }) 

        })

    })

  })
})
