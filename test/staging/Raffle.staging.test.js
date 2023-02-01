const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { resolve } = require("path")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", function () {
          let raffle, raffleEntranceFee, deployer, accounts

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              raffle = await ethers.getContract("Raffle", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
              accounts = await ethers.getSigners()
          })

          describe("fulfillRandomWords", function () {
              it("works with live chainlink keepers and vrf, we get a random winner", async function () {
                  // enter the raffle
                  const startingTimestamp = await raffle.getLatestTimestamp()

                  // setup listner before we enter the raffle, just in case the blockchain moves really fast
                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async function () {
                          console.log("WinnerPicked event fired!")
                          try {
                              // add our asserts here
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerEndingBalance = await accounts[0].getBalance()
                              const endingTimestamp = await raffle.getLatestTimestamp()

                              await expect(raffle.getPlayer(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(raffleState.toString(), "0")
                              assert(endingTimestamp > startingTimestamp)
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(raffleEntranceFee).toString()
                              )
                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })
                      // then entering the raffle
                      console.log("Entering Raffle ...")
                      const txn = await raffle.enterRaffle({ value: raffleEntranceFee })
                      await txn.wait(1)
                      console.log("Ok, time to wait ...")
                      const winnerStartingBalance = await accounts[0].getBalance()
                      // adn this code WONT complete until our listener has finished listening!
                  })
              })
          })
      })
