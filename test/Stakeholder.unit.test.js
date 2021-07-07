const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const { advanceTime, advanceBlockAndSetTime, advanceBlock, advanceTimeAndBlock, takeSnapshot, revertToSnapShot} = require('./helpers/standingTheTime');

const { ZERO_ADDRESS } = constants;
const GUARD = "0x0000000000000000000000000000000000000001";
const REVARD_PER_SECOND = "1982496194824962";

const StakeholderMock = artifacts.require("StakeholderMock");

contract('Stakeholder', function (accounts) {
    const [ owner, anotherAccount1, anotherAccount2, anotherAccount3, anotherAccount4, anotherAccount5 ] = accounts;

    const stakeholdersLimit = "4";
    const nextStakeholdersLimit = "5";

    beforeEach(async function () {
        this.stakeholder = await StakeholderMock.new(stakeholdersLimit, nextStakeholdersLimit);
    });

    describe('constructor', function () {
        it('check params', async function () {
            await assert.equal(
                (await this.stakeholder.stakeholdersLimit()).toString(),
                stakeholdersLimit
            );
            await assert.equal(
                (await this.stakeholder.nextStakeholdersLimit()).toString(),
                nextStakeholdersLimit
            );
        });
        it('check empty storage', async function () {
            await assert.equal(
                (await this.stakeholder.totalStakeholders()).toString(),
                "0"
            );

            const stakeholders = await this.stakeholder.stakeholders();
            await assert.equal(
                stakeholders.length,
                "0"
            );

            const worstStakeholderStats = await this.stakeholder.worstStakeholder();
            await assert.equal(
                worstStakeholderStats[0],
                "0x0000000000000000000000000000000000000000"
            );
            await assert.equal(
                worstStakeholderStats[1],
                "0"
            );

            await assert.equal(
                await this.stakeholder.getNextStakeholder(GUARD),
                GUARD
            );

            await assert.equal(
                (await this.stakeholder.totalClearStake()).toString(),
                "0"
            );
        });
        it('check constants', async function () {
            await assert.equal(
                (await this.stakeholder.rewardPerSecond()).toString(),
                REVARD_PER_SECOND
            );
        });
    });

    describe('add stakeholder', function () {
        describe('positive', function () {
            it('single', async function () {
                var receipt = await this.stakeholder.addStakeholder(anotherAccount1, new BN('1000'));
                var eventTime = ((await web3.eth.getBlock('latest')).timestamp).toString();

                expectEvent(receipt, 'AddStake', {
                    staker: anotherAccount1,
                    value: new BN('1000'),
                    resultClearStake: new BN('1000'),
                    resultTotalClearStake: new BN('1000'),
                    timestamp: eventTime
                });
                expectEvent(receipt, 'AddStakeholder', {
                    target: anotherAccount1,
                    value: new BN('1000'),
                    timestamp: eventTime
                });

                await assert.equal(
                    (await this.stakeholder.stakeOf(anotherAccount1)).toString(),
                    (new BN('1000')).toString()
                );
                await assert.equal(
                    (await this.stakeholder.expectedReward(anotherAccount1)).toString(),
                    (new BN('0')).toString()
                );
                await assert.equal(
                    (await this.stakeholder.clearStakeOf(anotherAccount1)).toString(),
                    (new BN('1000')).toString()
                );
                await assert.equal(
                    (await this.stakeholder.totalClearStake()).toString(),
                    (new BN('1000')).toString()
                );
                await assert.equal(
                    await this.stakeholder.isStakeholder(anotherAccount1),
                    true
                );
                await assert.equal(
                    (await this.stakeholder.totalStakeholders()).toString(),
                    "1"
                );
                await assert.equal(
                    (await this.stakeholder.stakeholders()).length,
                    "1"
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(GUARD),
                    anotherAccount1
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(anotherAccount1),
                    GUARD
                );
            });

            it('multiply', async function () {
                var receipt1 = await this.stakeholder.addStakeholder(anotherAccount1, new BN('2000'));
                var eventTime1 = ((await web3.eth.getBlock('latest')).timestamp).toString();

                expectEvent(receipt1, 'AddStake', {
                    staker: anotherAccount1,
                    value: new BN('2000'),
                    resultClearStake: new BN('2000'),
                    resultTotalClearStake: new BN('2000'),
                    timestamp: eventTime1
                });
                expectEvent(receipt1, 'AddStakeholder', {
                    target: anotherAccount1,
                    value: new BN('2000'),
                    timestamp: eventTime1
                });
                await assert.equal(
                    (await this.stakeholder.stakeOf(anotherAccount1)).toString(),
                    (new BN('2000')).toString()
                );
                await assert.equal(
                    (await this.stakeholder.clearStakeOf(anotherAccount1)).toString(),
                    (new BN('2000')).toString()
                );
                await assert.equal(
                    (await this.stakeholder.totalClearStake()).toString(),
                    (new BN('2000')).toString()
                );
                await assert.equal(
                    await this.stakeholder.isStakeholder(anotherAccount1),
                    true
                );
                await assert.equal(
                    (await this.stakeholder.totalStakeholders()).toString(),
                    "1"
                );
                var stakeholders = await this.stakeholder.stakeholders()
                await assert.equal(
                    stakeholders.length,
                    "1"
                );
                await assert.deepEqual(
                    stakeholders,
                    [[anotherAccount1, (new BN('2000')).toString()]]
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(GUARD),
                    anotherAccount1
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(anotherAccount1),
                    GUARD
                );
                var worstStakeholder = await this.stakeholder.worstStakeholder();
                await assert.equal(
                    worstStakeholder[0],
                    anotherAccount1
                );
                await assert.equal(
                    worstStakeholder[1],
                    (new BN('2000')).toString()
                );

                // put in worst position

                var receipt2 = await this.stakeholder.addStakeholder(anotherAccount2, new BN('1000'));
                var eventTime2 = ((await web3.eth.getBlock('latest')).timestamp).toString();

                expectEvent(receipt2, 'AddStake', {
                    staker: anotherAccount2,
                    value: new BN('1000'),
                    resultClearStake: new BN('1000'),
                    resultTotalClearStake: new BN('3000'),
                    timestamp: eventTime2
                });
                expectEvent(receipt2, 'AddStakeholder', {
                    target: anotherAccount2,
                    value: new BN('1000'),
                    timestamp: eventTime2
                });
                await assert.equal(
                    (await this.stakeholder.stakeOf(anotherAccount2)).toString(),
                    (new BN('1000')).toString()
                );
                await assert.equal(
                    (await this.stakeholder.clearStakeOf(anotherAccount2)).toString(),
                    (new BN('1000')).toString()
                );
                await assert.equal(
                    (await this.stakeholder.totalClearStake()).toString(),
                    (new BN('3000')).toString()
                );
                await assert.equal(
                    await this.stakeholder.isStakeholder(anotherAccount2),
                    true
                );
                await assert.equal(
                    (await this.stakeholder.totalStakeholders()).toString(),
                    "2"
                );
                var stakeholders = await this.stakeholder.stakeholders()
                await assert.equal(
                    stakeholders.length,
                    "2"
                );
                await assert.deepEqual(
                    stakeholders,
                    [[anotherAccount2, (new BN('1000')).toString()],[anotherAccount1, (new BN('2000')).toString()]]
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(GUARD),
                    anotherAccount2
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(anotherAccount2),
                    anotherAccount1
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(anotherAccount1),
                    GUARD
                );
                var worstStakeholder = await this.stakeholder.worstStakeholder();
                await assert.equal(
                    worstStakeholder[0],
                    anotherAccount2
                );
                await assert.equal(
                    worstStakeholder[1],
                    (new BN('1000')).toString()
                );

                // put in middle

                var receipt3 = await this.stakeholder.addStakeholder(anotherAccount3, new BN('1500'));
                var eventTime3 = ((await web3.eth.getBlock('latest')).timestamp).toString();

                expectEvent(receipt3, 'AddStake', {
                    staker: anotherAccount3,
                    value: new BN('1500'),
                    resultClearStake: new BN('1500'),
                    resultTotalClearStake: new BN('4500'),
                    timestamp: eventTime3
                });
                expectEvent(receipt3, 'AddStakeholder', {
                    target: anotherAccount3,
                    value: new BN('1500'),
                    timestamp: eventTime3
                });
                await assert.equal(
                    (await this.stakeholder.stakeOf(anotherAccount3)).toString(),
                    (new BN('1500')).toString()
                );
                await assert.equal(
                    (await this.stakeholder.clearStakeOf(anotherAccount3)).toString(),
                    (new BN('1500')).toString()
                );
                await assert.equal(
                    (await this.stakeholder.totalClearStake()).toString(),
                    (new BN('4500')).toString()
                );
                await assert.equal(
                    await this.stakeholder.isStakeholder(anotherAccount3),
                    true
                );
                await assert.equal(
                    (await this.stakeholder.totalStakeholders()).toString(),
                    "3"
                );
                var stakeholders = await this.stakeholder.stakeholders()
                await assert.equal(
                    stakeholders.length,
                    "3"
                );
                await assert.deepEqual(
                    stakeholders,
                    [[anotherAccount2, (new BN('1000')).toString()],[anotherAccount3, (new BN('1500')).toString()],[anotherAccount1, (new BN('2000')).toString()]]
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(GUARD),
                    anotherAccount2
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(anotherAccount2),
                    anotherAccount3
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(anotherAccount3),
                    anotherAccount1
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(anotherAccount1),
                    GUARD
                );
                var worstStakeholder = await this.stakeholder.worstStakeholder();
                await assert.equal(
                    worstStakeholder[0],
                    anotherAccount2
                );
                await assert.equal(
                    worstStakeholder[1],
                    (new BN('1000')).toString()
                );

                // put in a last position

                var receipt4 = await this.stakeholder.addStakeholder(anotherAccount4, new BN('4000'));
                var eventTime4 = ((await web3.eth.getBlock('latest')).timestamp).toString();

                expectEvent(receipt4, 'AddStake', {
                    staker: anotherAccount4,
                    value: new BN('4000'),
                    resultClearStake: new BN('4000'),
                    resultTotalClearStake: new BN('8500'),
                    timestamp: eventTime4
                });
                expectEvent(receipt4, 'AddStakeholder', {
                    target: anotherAccount4,
                    value: new BN('4000'),
                    timestamp: eventTime4
                });
                await assert.equal(
                    (await this.stakeholder.stakeOf(anotherAccount4)).toString(),
                    (new BN('4000')).toString()
                );
                await assert.equal(
                    (await this.stakeholder.clearStakeOf(anotherAccount4)).toString(),
                    (new BN('4000')).toString()
                );
                await assert.equal(
                    (await this.stakeholder.totalClearStake()).toString(),
                    (new BN('8500')).toString()
                );
                await assert.equal(
                    await this.stakeholder.isStakeholder(anotherAccount4),
                    true
                );
                await assert.equal(
                    (await this.stakeholder.totalStakeholders()).toString(),
                    "4"
                );
                var stakeholders = await this.stakeholder.stakeholders()
                await assert.equal(
                    stakeholders.length,
                    "4"
                );
                await assert.deepEqual(
                    stakeholders,
                    [[anotherAccount2, (new BN('1000')).toString()],[anotherAccount3, (new BN('1500')).toString()],[anotherAccount1, (new BN('2000')).toString()],[anotherAccount4, (new BN('4000')).toString()]]
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(GUARD),
                    anotherAccount2
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(anotherAccount2),
                    anotherAccount3
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(anotherAccount3),
                    anotherAccount1
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(anotherAccount1),
                    anotherAccount4
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(anotherAccount4),
                    GUARD
                );
                var worstStakeholder = await this.stakeholder.worstStakeholder();
                await assert.equal(
                    worstStakeholder[0],
                    anotherAccount2
                );
                await assert.equal(
                    worstStakeholder[1],
                    (new BN('1000')).toString()
                );
            });
        });
        describe('negative', function () {
            it('zero address', async function () {
                await expectRevert(
                    this.stakeholder.addStakeholder(ZERO_ADDRESS, new BN('1000')),
                    'Stakeholder: zero address error'
                );
            });

            it('GUARD address error', async function () {
                await expectRevert(
                    this.stakeholder.addStakeholder(GUARD, new BN('1000')),
                    'Stakeholder: GUARD address error'
                );
            });

            it('primary state error', async function () {
                await this.stakeholder.addStakeholder(anotherAccount1, new BN('1000'));
                await expectRevert(
                    this.stakeholder.addStakeholder(anotherAccount1, new BN('1000')),
                    'Stakeholder: is already a stakeholder'
                );
            });

            it('zero value error', async function () {
                await expectRevert(
                    this.stakeholder.addStakeholder(anotherAccount1, new BN('0')),
                    'Stakeholder: zero value error'
                );
            });
        });
    });

    describe('remove stakeholder', function () {
        describe('positive', function () {
            it('single', async function () {
                await this.stakeholder.addStakeholder(anotherAccount1, new BN('1000'));
                var receipt = await this.stakeholder.removeStakeholder(anotherAccount1);
                var eventTime = ((await web3.eth.getBlock('latest')).timestamp).toString();

                expectEvent(receipt, 'SubStake', {
                    staker: anotherAccount1,
                    value: new BN('1000'),
                    resultClearStake: new BN('0'),
                    resultTotalClearStake: new BN('0'),
                    timestamp: eventTime
                });
                expectEvent(receipt, 'RemoveStakeholder', {
                    target: anotherAccount1,
                    value: new BN('1000'),
                    timestamp: eventTime
                });

                await assert.equal(
                    (await this.stakeholder.stakeOf(anotherAccount1)).toString(),
                    (new BN('0')).toString()
                );
                await assert.equal(
                    (await this.stakeholder.expectedReward(anotherAccount1)).toString(),
                    (new BN('0')).toString()
                );
                await assert.equal(
                    (await this.stakeholder.clearStakeOf(anotherAccount1)).toString(),
                    (new BN('0')).toString()
                );
                await assert.equal(
                    (await this.stakeholder.totalClearStake()).toString(),
                    (new BN('0')).toString()
                );
                await assert.equal(
                    await this.stakeholder.isStakeholder(anotherAccount1),
                    false
                );
                await assert.equal(
                    (await this.stakeholder.totalStakeholders()).toString(),
                    "0"
                );
                await assert.equal(
                    (await this.stakeholder.stakeholders()).length,
                    "0"
                );
                var stakeholders = await this.stakeholder.stakeholders()
                await assert.equal(
                    stakeholders.length,
                    "0"
                );
                await assert.deepEqual(
                    stakeholders,
                    []
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(GUARD),
                    GUARD
                );
                var worstStakeholder = await this.stakeholder.worstStakeholder();
                await assert.equal(
                    worstStakeholder[0],
                    ZERO_ADDRESS
                );
                await assert.equal(
                    worstStakeholder[1],
                    (new BN('0')).toString()
                );
            });

            it('multiply', async function () {
                await this.stakeholder.addStakeholder(anotherAccount1, new BN('3000'));
                await this.stakeholder.addStakeholder(anotherAccount2, new BN('1000'));
                await this.stakeholder.addStakeholder(anotherAccount3, new BN('4000'));
                await this.stakeholder.addStakeholder(anotherAccount4, new BN('2000'));

                var receipt1 = await this.stakeholder.removeStakeholder(anotherAccount1);
                var eventTime1 = ((await web3.eth.getBlock('latest')).timestamp).toString();

                expectEvent(receipt1, 'SubStake', {
                    staker: anotherAccount1,
                    value: new BN('3000'),
                    resultClearStake: new BN('0'),
                    resultTotalClearStake: new BN('7000'),
                    timestamp: eventTime1
                });
                expectEvent(receipt1, 'RemoveStakeholder', {
                    target: anotherAccount1,
                    value: new BN('3000'),
                    timestamp: eventTime1
                });
                await assert.equal(
                    (await this.stakeholder.stakeOf(anotherAccount1)).toString(),
                    (new BN('0')).toString()
                );
                await assert.equal(
                    (await this.stakeholder.clearStakeOf(anotherAccount1)).toString(),
                    (new BN('0')).toString()
                );
                await assert.equal(
                    (await this.stakeholder.totalClearStake()).toString(),
                    (new BN('7000')).toString()
                );
                await assert.equal(
                    await this.stakeholder.isStakeholder(anotherAccount1),
                    false
                );
                await assert.equal(
                    (await this.stakeholder.totalStakeholders()).toString(),
                    "3"
                );
                var stakeholders = await this.stakeholder.stakeholders()
                await assert.equal(
                    stakeholders.length,
                    "3"
                );
                await assert.deepEqual(
                    stakeholders,
                    [[anotherAccount2, (new BN('1000')).toString()],[anotherAccount4, (new BN('2000')).toString()],[anotherAccount3, (new BN('4000')).toString()]]
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(GUARD),
                    anotherAccount2
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(anotherAccount2),
                    anotherAccount4
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(anotherAccount4),
                    anotherAccount3
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(anotherAccount3),
                    GUARD
                );
                var worstStakeholder = await this.stakeholder.worstStakeholder();
                await assert.equal(
                    worstStakeholder[0],
                    anotherAccount2
                );
                await assert.equal(
                    worstStakeholder[1],
                    (new BN('1000')).toString()
                );

                var receipt2 = await this.stakeholder.removeStakeholder(anotherAccount2);
                var eventTime2 = ((await web3.eth.getBlock('latest')).timestamp).toString();

                expectEvent(receipt2, 'SubStake', {
                    staker: anotherAccount2,
                    value: new BN('1000'),
                    resultClearStake: new BN('0'),
                    resultTotalClearStake: new BN('6000'),
                    timestamp: eventTime2
                });
                expectEvent(receipt2, 'RemoveStakeholder', {
                    target: anotherAccount2,
                    value: new BN('1000'),
                    timestamp: eventTime2
                });
                await assert.equal(
                    (await this.stakeholder.stakeOf(anotherAccount2)).toString(),
                    (new BN('0')).toString()
                );
                await assert.equal(
                    (await this.stakeholder.clearStakeOf(anotherAccount2)).toString(),
                    (new BN('0')).toString()
                );
                await assert.equal(
                    (await this.stakeholder.totalClearStake()).toString(),
                    (new BN('6000')).toString()
                );
                await assert.equal(
                    await this.stakeholder.isStakeholder(anotherAccount2),
                    false
                );
                await assert.equal(
                    (await this.stakeholder.totalStakeholders()).toString(),
                    "2"
                );
                var stakeholders = await this.stakeholder.stakeholders()
                await assert.equal(
                    stakeholders.length,
                    "2"
                );
                await assert.deepEqual(
                    stakeholders,
                    [[anotherAccount4, (new BN('2000')).toString()],[anotherAccount3, (new BN('4000')).toString()]]
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(GUARD),
                    anotherAccount4
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(anotherAccount4),
                    anotherAccount3
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(anotherAccount3),
                    GUARD
                );
                var worstStakeholder = await this.stakeholder.worstStakeholder();
                await assert.equal(
                    worstStakeholder[0],
                    anotherAccount4
                );
                await assert.equal(
                    worstStakeholder[1],
                    (new BN('2000')).toString()
                );

                var receipt3 = await this.stakeholder.removeStakeholder(anotherAccount3);
                var eventTime3 = ((await web3.eth.getBlock('latest')).timestamp).toString();

                expectEvent(receipt3, 'SubStake', {
                    staker: anotherAccount3,
                    value: new BN('4000'),
                    resultClearStake: new BN('0'),
                    resultTotalClearStake: new BN('2000'),
                    timestamp: eventTime3
                });
                expectEvent(receipt3, 'RemoveStakeholder', {
                    target: anotherAccount3,
                    value: new BN('4000'),
                    timestamp: eventTime3
                });
                await assert.equal(
                    (await this.stakeholder.stakeOf(anotherAccount3)).toString(),
                    (new BN('0')).toString()
                );
                await assert.equal(
                    (await this.stakeholder.clearStakeOf(anotherAccount3)).toString(),
                    (new BN('0')).toString()
                );
                await assert.equal(
                    (await this.stakeholder.totalClearStake()).toString(),
                    (new BN('2000')).toString()
                );
                await assert.equal(
                    await this.stakeholder.isStakeholder(anotherAccount3),
                    false
                );
                await assert.equal(
                    (await this.stakeholder.totalStakeholders()).toString(),
                    "1"
                );
                var stakeholders = await this.stakeholder.stakeholders()
                await assert.equal(
                    stakeholders.length,
                    "1"
                );
                await assert.deepEqual(
                    stakeholders,
                    [[anotherAccount4, (new BN('2000')).toString()]]
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(GUARD),
                    anotherAccount4
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(anotherAccount4),
                    GUARD
                );
                var worstStakeholder = await this.stakeholder.worstStakeholder();
                await assert.equal(
                    worstStakeholder[0],
                    anotherAccount4
                );
                await assert.equal(
                    worstStakeholder[1],
                    (new BN('2000')).toString()
                );

                var receipt4 = await this.stakeholder.removeStakeholder(anotherAccount4);
                var eventTime4 = ((await web3.eth.getBlock('latest')).timestamp).toString();

                expectEvent(receipt4, 'SubStake', {
                    staker: anotherAccount4,
                    value: new BN('2000'),
                    resultClearStake: new BN('0'),
                    resultTotalClearStake: new BN('0'),
                    timestamp: eventTime4
                });
                expectEvent(receipt4, 'RemoveStakeholder', {
                    target: anotherAccount4,
                    value: new BN('2000'),
                    timestamp: eventTime4
                });
                await assert.equal(
                    (await this.stakeholder.stakeOf(anotherAccount4)).toString(),
                    (new BN('0')).toString()
                );
                await assert.equal(
                    (await this.stakeholder.clearStakeOf(anotherAccount4)).toString(),
                    (new BN('0')).toString()
                );
                await assert.equal(
                    (await this.stakeholder.totalClearStake()).toString(),
                    (new BN('0')).toString()
                );
                await assert.equal(
                    await this.stakeholder.isStakeholder(anotherAccount4),
                    false
                );
                await assert.equal(
                    (await this.stakeholder.totalStakeholders()).toString(),
                    "0"
                );
                var stakeholders = await this.stakeholder.stakeholders()
                await assert.equal(
                    stakeholders.length,
                    "0"
                );
                await assert.deepEqual(
                    stakeholders,
                    []
                );
                await assert.equal(
                    await this.stakeholder.getNextStakeholder(GUARD),
                    GUARD
                );
                var worstStakeholder = await this.stakeholder.worstStakeholder();
                await assert.equal(
                    worstStakeholder[0],
                    ZERO_ADDRESS
                );
                await assert.equal(
                    worstStakeholder[1],
                    (new BN('0')).toString()
                );
            });
        });
        describe('negative', function () {
            beforeEach(async function () {
                this.stakeholder.addStakeholder(anotherAccount1, new BN('1000'))
              });
            it('zero address', async function () {
                await expectRevert(
                    this.stakeholder.removeStakeholder(ZERO_ADDRESS),
                    'Stakeholder: zero address error'
                );
            });

            it('GUARD address error', async function () {
                await expectRevert(
                    this.stakeholder.removeStakeholder(GUARD),
                    'Stakeholder: GUARD address error'
                );
            });

            it('primary state error', async function () {
                await expectRevert(
                    this.stakeholder.removeStakeholder(anotherAccount2),
                    'Stakeholder: not a staker'
                );
            });
        });
    });


})
