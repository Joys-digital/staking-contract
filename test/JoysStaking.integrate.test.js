const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { assertion } = require('@openzeppelin/test-helpers/src/expectRevert');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { advanceTime, advanceBlockAndSetTime, advanceBlock, advanceTimeAndBlock, takeSnapshot, revertToSnapShot} = require('./helpers/standingTheTime');
const wait = require('./helpers/wait');
const { ZERO_ADDRESS } = constants;
const REVARD_PER_SECOND = "1982496194824962";
const GUARD = "0x0000000000000000000000000000000000000001";

const Vault = artifacts.require("Vault");
const JoysStaking = artifacts.require("JoysStaking");

const checkEmptyStakeholder = async (target, inst) => {
    await assert.equal(
        (await inst.stakeOf(target)).toString(),
        "0"
    );
    await assert.equal(
        (await inst.expectedReward(target)).toString(),
        "0"
    );
    await assert.equal(
        (await inst.rewardsOf(target)).toString(),
        "0"
    );
    await assert.equal(
        (await inst.clearStakeOf(target)).toString(),
        "0"
    );
    await assert.equal(
        (await inst.totalClearStake()).toString(),
        "0"
    );
    await assert.equal(
        await inst.isStakeholder(target),
        false
    );
    await assert.equal(
        (await inst.totalStakeholders()).toString(),
        "0"
    );
    await assert.equal(
        (await inst.stakeholders()).length,
        "0"
    );
    var worstStakeholder = await inst.worstStakeholder();
    await assert.equal(
        worstStakeholder[0],
        ZERO_ADDRESS
    );
    await assert.equal(
        worstStakeholder[1],
        "0"
    );
    await assert.equal(
        await inst.getNextStakeholder(GUARD),
        GUARD
    );
}

contract('JoysStaking', function (accounts) {
    const [ owner, anotherAccount1, anotherAccount2, anotherAccount3, anotherAccount4, anotherAccount5 ] = accounts;

    const minimalStake = web3.utils.toWei("1",'ether');;
    const stakeholdersLimit = "4";
    const nextStakeholdersLimit = "5";

    
    beforeEach(async function () {
        this.vaultInst = await Vault.new();
        await this.vaultInst.send(minimalStake);
        this.joysStakingInst = await JoysStaking.new(minimalStake, stakeholdersLimit, nextStakeholdersLimit, this.vaultInst.address);

        // check balances
        await assert.equal(
            await web3.eth.getBalance(this.joysStakingInst.address),
            (await this.joysStakingInst.totalClearStake()).toString()
        );
    });

    describe('constructor', function () {
        it('check params', async function () {
            await assert.equal(
                (await this.joysStakingInst.minimalStake()).toString(),
                minimalStake
            );
            await assert.equal(
                (await this.joysStakingInst.stakeholdersLimit()).toString(),
                stakeholdersLimit
            );
            await assert.equal(
                (await this.joysStakingInst.nextStakeholdersLimit()).toString(),
                nextStakeholdersLimit
            );
            await assert.equal(
                await this.joysStakingInst.vault(),
                this.vaultInst.address
            );
        });
        it('check empty storage', async function () {
            await assert.equal(
                (await this.joysStakingInst.totalStakeholders()).toString(),
                "0"
            );

            const stakeholders = await this.joysStakingInst.stakeholders();
            await assert.equal(
                stakeholders.length,
                "0"
            );

            const worstStakeholderStats = await this.joysStakingInst.worstStakeholder();
            await assert.equal(
                worstStakeholderStats[0],
                "0x0000000000000000000000000000000000000000"
            );
            await assert.equal(
                worstStakeholderStats[1],
                "0"
            );

            await assert.equal(
                await this.joysStakingInst.getNextStakeholder(GUARD),
                GUARD
            );

            await assert.equal(
                (await this.joysStakingInst.totalClearStake()).toString(),
                "0"
            );
        });
        it('check constants', async function () {
            await assert.equal(
                (await this.joysStakingInst.rewardPerSecond()).toString(),
                REVARD_PER_SECOND
            );
        });
        it('check negative deploy cases', async function () {
            await expectRevert(
                JoysStaking.new("0", stakeholdersLimit, nextStakeholdersLimit, this.vaultInst.address),
                "JoysStaking: 'newMinimalStake' arg error",
            );
            await expectRevert(
                JoysStaking.new(minimalStake, "0", nextStakeholdersLimit, this.vaultInst.address),
                "JoysStaking: 'newStartedStakeholdersLimit' arg error",
            );
            await expectRevert(
                JoysStaking.new(minimalStake, stakeholdersLimit, "0", this.vaultInst.address),
                "JoysStaking: 'newNextStakeholdersLimit' arg error",
            );
            await expectRevert(
                JoysStaking.new(minimalStake, stakeholdersLimit, nextStakeholdersLimit, anotherAccount1),
                "JoysStaking: 'vault' must be contract",
            );
        });
    });

    // describe('receive', function () {
    //     it('not vault', async function () {
    //         await expectRevert(
    //             this.joysStakingInst.send('1000'),
    //             "JoysStaking: sender must be Vault"
    //         );
    //     });
    // });

    describe('emergencyClosePosition', function () {
        describe('positive', function () {
            it('close position', async function () {
                await this.joysStakingInst.deposit({from: anotherAccount1, value: minimalStake});
                var freezedTimestamp1 = (await web3.eth.getBlock('latest')).timestamp;
                
                // check balances
                await assert.equal(
                    await web3.eth.getBalance(this.joysStakingInst.address),
                    (await this.joysStakingInst.totalClearStake()).toString()
                );

                var balanceBefore = await web3.eth.getBalance(anotherAccount1);

                var receipt = await this.joysStakingInst.emergencyClosePosition(anotherAccount1, {from: owner});
                var freezedTimestamp2 = (await web3.eth.getBlock('latest')).timestamp;
                var eventTime = freezedTimestamp2.toString();
                var passedTime = freezedTimestamp2 - freezedTimestamp1;
                var rewarded = (new BN(REVARD_PER_SECOND)).mul(new BN(passedTime));

                // check balances
                await assert.equal(
                    await web3.eth.getBalance(this.joysStakingInst.address),
                    (await this.joysStakingInst.totalClearStake()).toString()
                );

                expectEvent(receipt, 'SubStake', {
                    staker: anotherAccount1,
                    value: new BN(minimalStake).add(rewarded),
                    resultClearStake: "0",
                    resultTotalClearStake: "0",
                    timestamp: eventTime
                });
                expectEvent(receipt, 'RemoveStakeholder', {
                    target: anotherAccount1,
                    value: new BN(minimalStake).add(rewarded),
                    timestamp: eventTime
                });
                expectEvent(receipt, 'Transfer', {
                    target: anotherAccount1,
                    value: new BN(minimalStake).add(rewarded),
                    timestamp: eventTime
                });
                expectEvent(receipt, 'EmergencyClosePosition', {
                    owner: owner,
                    target: anotherAccount1,
                    value: new BN(minimalStake).add(rewarded),
                    timestamp: eventTime
                });

                var balanceAfter = await web3.eth.getBalance(anotherAccount1);

                await assert.equal(
                    balanceAfter.toString(),
                    new BN(balanceBefore).add(new BN(minimalStake)).add(rewarded).toString()
                );

                await assert.equal(
                    (await this.joysStakingInst.stakeOf(anotherAccount1)).toString(),
                    "0"
                );
                await assert.equal(
                    (await this.joysStakingInst.expectedReward(anotherAccount1)).toString(),
                    "0"
                );
                await assert.equal(
                    (await this.joysStakingInst.clearStakeOf(anotherAccount1)).toString(),
                    "0"
                );
                await assert.equal(
                    (await this.joysStakingInst.totalClearStake()).toString(),
                    "0"
                );
                await assert.equal(
                    await this.joysStakingInst.isStakeholder(anotherAccount1),
                    false
                );
                await assert.equal(
                    (await this.joysStakingInst.totalStakeholders()).toString(),
                    "0"
                );
                await assert.equal(
                    (await this.joysStakingInst.stakeholders()).length,
                    "0"
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(GUARD),
                    GUARD
                );
            });
        });
        describe('negative', function () {
            it('wrong owner', async function () {
                await this.joysStakingInst.deposit({from: anotherAccount1, value: minimalStake});

                await expectRevert(
                    this.joysStakingInst.emergencyClosePosition(anotherAccount1, {from: anotherAccount5}),
                    'StakingOwnable: caller is not the owner',
                );
            });

            it('target is not stakeholder', async function () {
                await this.joysStakingInst.deposit({from: anotherAccount1, value: minimalStake});

                await expectRevert(
                    this.joysStakingInst.emergencyClosePosition(anotherAccount2, {from: owner}),
                    'JoysStaking: target must be a stakeholder',
                );
            })
        });
    });

    describe('updateStakeholdersLimit', function () {
        describe('positive', function () {
            it('update limit', async function () {
                await assert.equal(
                    await this.joysStakingInst.stakeholdersLimit(),
                    stakeholdersLimit
                );
                await assert.equal(
                    await this.joysStakingInst.nextStakeholdersLimit(),
                    nextStakeholdersLimit
                );

                await this.joysStakingInst.updateStakeholdersLimit({from: owner});

                await assert.equal(
                    await this.joysStakingInst.nextStakeholdersLimit(),
                    nextStakeholdersLimit
                );
                await assert.equal(
                    await this.joysStakingInst.stakeholdersLimit(),
                    nextStakeholdersLimit
                );
            });
        });
        describe('negative', function () {
            it('wrong owner', async function () {
                await expectRevert(
                    this.joysStakingInst.updateStakeholdersLimit({from: anotherAccount1}),
                    'StakingOwnable: caller is not the owner',
                );
            });

            it('already been updated', async function () {
                await this.joysStakingInst.updateStakeholdersLimit({from: owner});

                await expectRevert(
                    this.joysStakingInst.updateStakeholdersLimit({from: owner}),
                    'Stakeholder: stakeholders limit has already been updated',
                );
            });
        });
    });

    describe('deposit', function () {
        describe('positive', function () {
            it('new-single', async function () {

                await checkEmptyStakeholder(anotherAccount1, this.joysStakingInst);

                var receipt = await this.joysStakingInst.deposit({from: anotherAccount1, value: minimalStake});

                // check balances
                await assert.equal(
                    await web3.eth.getBalance(this.joysStakingInst.address),
                    (await this.joysStakingInst.totalClearStake()).toString()
                );

                var eventTime = ((await web3.eth.getBlock('latest')).timestamp).toString();
                expectEvent(receipt, 'Deposit', {
                    user: anotherAccount1,
                    value: minimalStake,
                    timestamp: eventTime
                });
                expectEvent(receipt, 'AddStake', {
                    staker: anotherAccount1,
                    value: minimalStake,
                    resultClearStake: minimalStake,
                    resultTotalClearStake: minimalStake,
                    timestamp: eventTime
                });
                expectEvent(receipt, 'AddStakeholder', {
                    target: anotherAccount1,
                    value: minimalStake,
                    timestamp: eventTime
                });

                var freezedTimestamp = (await web3.eth.getBlock('latest')).timestamp;
                await advanceBlockAndSetTime(freezedTimestamp + 1);

                await assert.equal(
                    (await this.joysStakingInst.lastUpdateAt(anotherAccount1)).toString(),
                    eventTime
                );
                await assert.equal(
                    (await this.joysStakingInst.stakeOf(anotherAccount1)).toString(),
                    (new BN(minimalStake)).add(new BN(REVARD_PER_SECOND)).toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.expectedReward(anotherAccount1)).toString(),
                    REVARD_PER_SECOND
                );
                await assert.equal(
                    (await this.joysStakingInst.rewardsOf(anotherAccount1)).toString(),
                    REVARD_PER_SECOND
                );
                await assert.equal(
                    (await this.joysStakingInst.clearStakeOf(anotherAccount1)).toString(),
                    minimalStake
                );
                await assert.equal(
                    (await this.joysStakingInst.totalClearStake()).toString(),
                    minimalStake
                );
                await assert.equal(
                    await this.joysStakingInst.isStakeholder(anotherAccount1),
                    true
                );
                await assert.equal(
                    (await this.joysStakingInst.totalStakeholders()).toString(),
                    "1"
                );
                await assert.equal(
                    (await this.joysStakingInst.stakeholders()).length,
                    "1"
                );
                var worstStakeholder = await this.joysStakingInst.worstStakeholder();
                await assert.equal(
                    worstStakeholder[0],
                    anotherAccount1
                );
                await assert.equal(
                    worstStakeholder[1],
                    (new BN(minimalStake)).add(new BN(REVARD_PER_SECOND)).toString()
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(GUARD),
                    anotherAccount1
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(anotherAccount1),
                    GUARD
                );
            });
    
            it('new-multiply', async function () {

                await checkEmptyStakeholder(anotherAccount1, this.joysStakingInst);
                await checkEmptyStakeholder(anotherAccount2, this.joysStakingInst);
                await checkEmptyStakeholder(anotherAccount3, this.joysStakingInst);

                // anotherAccount1 > anotherAccount3 > anotherAccount2

                // check acc 1
                var receipt = await this.joysStakingInst.deposit({from: anotherAccount1, value: (new BN(minimalStake)).toString()});
                var freezedTimestamp1 = (await web3.eth.getBlock('latest')).timestamp;

                // check balances
                await assert.equal(
                    await web3.eth.getBalance(this.joysStakingInst.address),
                    (await this.joysStakingInst.totalClearStake()).toString()
                );

                var eventTime = await freezedTimestamp1.toString();
                expectEvent(receipt, 'Deposit', {
                    user: anotherAccount1,
                    value: minimalStake,
                    timestamp: eventTime
                });
                expectEvent(receipt, 'AddStake', {
                    staker: anotherAccount1,
                    value: minimalStake,
                    resultClearStake: minimalStake,
                    resultTotalClearStake: minimalStake,
                    timestamp: eventTime
                });
                expectEvent(receipt, 'AddStakeholder', {
                    target: anotherAccount1,
                    value: minimalStake,
                    timestamp: eventTime
                });

                await advanceBlockAndSetTime(freezedTimestamp1 + 5);
                await assert.equal(
                    (await this.joysStakingInst.lastUpdateAt(anotherAccount1)).toString(),
                    eventTime
                );
                await assert.equal(
                    (await this.joysStakingInst.stakeOf(anotherAccount1)).toString(),
                    (new BN(minimalStake)).add((new BN(REVARD_PER_SECOND)).mul(new BN(5))).toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.expectedReward(anotherAccount1)).toString(),
                    (new BN(REVARD_PER_SECOND)).mul(new BN(5)).toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.rewardsOf(anotherAccount1)).toString(),
                    (new BN(REVARD_PER_SECOND)).mul(new BN(5)).toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.clearStakeOf(anotherAccount1)).toString(),
                    minimalStake
                );
                await assert.equal(
                    await this.joysStakingInst.isStakeholder(anotherAccount1),
                    true
                );

                // check acc 2
                var receipt = await this.joysStakingInst.deposit({from: anotherAccount2, value: ((new BN(minimalStake)).mul(new BN(3))).toString()});
                var freezedTimestamp2 = (await web3.eth.getBlock('latest')).timestamp;

                // check balances
                await assert.equal(
                    await web3.eth.getBalance(this.joysStakingInst.address),
                    (await this.joysStakingInst.totalClearStake()).toString()
                );

                var eventTime = await freezedTimestamp2.toString();
                expectEvent(receipt, 'Deposit', {
                    user: anotherAccount2,
                    value: ((new BN(minimalStake)).mul(new BN(3))).toString(),
                    timestamp: eventTime
                });
                expectEvent(receipt, 'AddStake', {
                    staker: anotherAccount2,
                    value: ((new BN(minimalStake)).mul(new BN(3))).toString(),
                    resultClearStake: ((new BN(minimalStake)).mul(new BN(3))).toString(),
                    resultTotalClearStake: ((new BN(minimalStake)).mul(new BN(4))).toString(),
                    timestamp: eventTime
                });
                expectEvent(receipt, 'AddStakeholder', {
                    target: anotherAccount2,
                    value: ((new BN(minimalStake)).mul(new BN(3))).toString(),
                    timestamp: eventTime
                });

                await advanceBlockAndSetTime(freezedTimestamp2 + 10);
                await assert.equal(
                    (await this.joysStakingInst.stakeOf(anotherAccount2)).toString(),
                    ((new BN(minimalStake)).mul(new BN(3))).add((new BN(REVARD_PER_SECOND)).mul(new BN(10))).toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.expectedReward(anotherAccount2)).toString(),
                    (new BN(REVARD_PER_SECOND)).mul(new BN(10)).toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.rewardsOf(anotherAccount2)).toString(),
                    (new BN(REVARD_PER_SECOND)).mul(new BN(10)).toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.clearStakeOf(anotherAccount2)).toString(),
                    (new BN(minimalStake)).mul(new BN(3))
                );
                await assert.equal(
                    await this.joysStakingInst.isStakeholder(anotherAccount2),
                    true
                );

                // check acc 3
                var receipt = await this.joysStakingInst.deposit({from: anotherAccount3, value: (new BN(minimalStake)).mul(new BN(2)).toString()});
                var freezedTimestamp2 = (await web3.eth.getBlock('latest')).timestamp;

                // check balances
                await assert.equal(
                    await web3.eth.getBalance(this.joysStakingInst.address),
                    (await this.joysStakingInst.totalClearStake()).toString()
                );

                var eventTime = await freezedTimestamp2.toString();
                expectEvent(receipt, 'Deposit', {
                    user: anotherAccount3,
                    value: ((new BN(minimalStake)).mul(new BN(2))).toString(),
                    timestamp: eventTime
                });
                expectEvent(receipt, 'AddStake', {
                    staker: anotherAccount3,
                    value: ((new BN(minimalStake)).mul(new BN(2))).toString(),
                    resultClearStake: ((new BN(minimalStake)).mul(new BN(2))).toString(),
                    resultTotalClearStake: ((new BN(minimalStake)).mul(new BN(6))).toString(),
                    timestamp: eventTime
                });
                expectEvent(receipt, 'AddStakeholder', {
                    target: anotherAccount3,
                    value: ((new BN(minimalStake)).mul(new BN(2))).toString(),
                    timestamp: eventTime
                });

                await advanceBlockAndSetTime(freezedTimestamp2 + 12);
                // check balances
                await assert.equal(
                    await web3.eth.getBalance(this.joysStakingInst.address),
                    (await this.joysStakingInst.totalClearStake()).toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.lastUpdateAt(anotherAccount3)).toString(),
                    freezedTimestamp2.toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.stakeOf(anotherAccount3)).toString(),
                    ((new BN(minimalStake)).mul(new BN(2))).add((new BN(REVARD_PER_SECOND)).mul(new BN(12))).toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.expectedReward(anotherAccount3)).toString(),
                    (new BN(REVARD_PER_SECOND)).mul(new BN(12)).toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.rewardsOf(anotherAccount3)).toString(),
                    (new BN(REVARD_PER_SECOND)).mul(new BN(12)).toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.clearStakeOf(anotherAccount3)).toString(),
                    (new BN(minimalStake)).mul(new BN(2))
                );
                await assert.equal(
                    await this.joysStakingInst.isStakeholder(anotherAccount3),
                    true
                );

                // overall stats
                await assert.equal(
                    (await this.joysStakingInst.totalClearStake()).toString(),
                    ((new BN(minimalStake)).mul(new BN(6))).toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.totalStakeholders()).toString(),
                    "3"
                );
                await assert.equal(
                    (await this.joysStakingInst.stakeholders()).length,
                    "3"
                );
                var worstStakeholder = await this.joysStakingInst.worstStakeholder();
                await assert.equal(
                    worstStakeholder[0],
                    anotherAccount1
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(GUARD),
                    anotherAccount1
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(anotherAccount1),
                    anotherAccount3
                );
            });

            it('additional-single', async function () {

                await checkEmptyStakeholder(anotherAccount1, this.joysStakingInst);

                var receipt1 = await this.joysStakingInst.deposit({from: anotherAccount1, value: minimalStake});
                var freezedTimestamp1 = (await web3.eth.getBlock('latest')).timestamp;

                // check balances
                await assert.equal(
                    await web3.eth.getBalance(this.joysStakingInst.address),
                    (await this.joysStakingInst.totalClearStake()).toString()
                );

                var eventTime = await freezedTimestamp1.toString();
                expectEvent(receipt1, 'Deposit', {
                    user: anotherAccount1,
                    value: minimalStake,
                    timestamp: eventTime
                });
                expectEvent(receipt1, 'AddStake', {
                    staker: anotherAccount1,
                    value: minimalStake,
                    resultClearStake: minimalStake,
                    resultTotalClearStake: minimalStake,
                    timestamp: eventTime
                });
                expectEvent(receipt1, 'AddStakeholder', {
                    target: anotherAccount1,
                    value: minimalStake,
                    timestamp: eventTime
                });

                var value2 = await ((new BN(minimalStake)).div(new BN(2))).toString();

                var receipt2 = await this.joysStakingInst.deposit({from: anotherAccount1, value: value2});
                var freezedTimestamp2 = (await web3.eth.getBlock('latest')).timestamp;

                // check balances
                await assert.equal(
                    await web3.eth.getBalance(this.joysStakingInst.address),
                    (await this.joysStakingInst.totalClearStake()).toString()
                );

                var eventTime = await freezedTimestamp2.toString();

                // calculating reward
                var passedTime = freezedTimestamp2 - freezedTimestamp1;
                var rewarded = (new BN(REVARD_PER_SECOND)).mul(new BN(passedTime));
                
                expectEvent(receipt2, 'Deposit', {
                    user: anotherAccount1,
                    value: value2,
                    timestamp: eventTime
                });
                expectEvent(receipt2, 'IncreaseStakeholder', {
                    target: anotherAccount1,
                    value: value2,
                    timestamp: eventTime
                });
                expectEvent(receipt2, 'Receive', {
                    from: this.vaultInst.address,
                    value: rewarded,
                    timestamp: eventTime
                });
                
                
                var timeJump = (freezedTimestamp2 + 1);
                var passedTime = passedTime + 1;
                var rewards = (new BN(REVARD_PER_SECOND)).mul(new BN(passedTime));
                var expected = new BN(REVARD_PER_SECOND).mul(new BN(1));

                await advanceBlockAndSetTime(timeJump);

                // check balances
                await assert.equal(
                    await web3.eth.getBalance(this.joysStakingInst.address),
                    (await this.joysStakingInst.totalClearStake()).toString()
                );                

                await assert.equal(
                    (await this.joysStakingInst.stakeOf(anotherAccount1)).toString(),
                    ((new BN(minimalStake)).add((new BN(minimalStake)).div(new BN(2)))).add(rewards).toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.expectedReward(anotherAccount1)).toString(),
                    expected.toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.rewardsOf(anotherAccount1)).toString(),
                    rewards
                );
                await assert.equal(
                    (await this.joysStakingInst.clearStakeOf(anotherAccount1)).toString(),
                    (new BN(minimalStake)).add((new BN(minimalStake)).div(new BN(2))).add(rewarded).toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.totalClearStake()).toString(),
                    (new BN(minimalStake)).add((new BN(minimalStake)).div(new BN(2))).add(rewarded).toString()
                );
                await assert.equal(
                    await this.joysStakingInst.isStakeholder(anotherAccount1),
                    true
                );
                await assert.equal(
                    (await this.joysStakingInst.totalStakeholders()).toString(),
                    "1"
                );
                await assert.equal(
                    (await this.joysStakingInst.stakeholders()).length,
                    "1"
                );
                var worstStakeholder = await this.joysStakingInst.worstStakeholder();
                await assert.equal(
                    worstStakeholder[0],
                    anotherAccount1
                );
                await assert.equal(
                    worstStakeholder[1],
                    ((new BN(minimalStake)).add((new BN(minimalStake)).div(new BN(2)))).add(rewards).toString()
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(GUARD),
                    anotherAccount1
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(anotherAccount1),
                    GUARD
                );
            });

            it('drop worst', async function () {

                await checkEmptyStakeholder(anotherAccount1, this.joysStakingInst);
                await checkEmptyStakeholder(anotherAccount2, this.joysStakingInst);
                await checkEmptyStakeholder(anotherAccount3, this.joysStakingInst);
                await checkEmptyStakeholder(anotherAccount4, this.joysStakingInst);
                await checkEmptyStakeholder(anotherAccount5, this.joysStakingInst);
                
                // anotherAccount3 is worst
                var receipt1 = await this.joysStakingInst.deposit({from: anotherAccount1, value: (new BN(minimalStake)).mul(new BN("2"))});
                var receipt2 = await this.joysStakingInst.deposit({from: anotherAccount2, value: (new BN(minimalStake)).mul(new BN("3"))});
                var receipt3 = await this.joysStakingInst.deposit({from: anotherAccount3, value: (new BN(minimalStake)).mul(new BN("1"))});
                var freezedTimestamp1 = (await web3.eth.getBlock('latest')).timestamp;
                var receipt4 = await this.joysStakingInst.deposit({from: anotherAccount4, value: (new BN(minimalStake)).mul(new BN("3"))});

                // check balances
                await assert.equal(
                    await web3.eth.getBalance(this.joysStakingInst.address),
                    (await this.joysStakingInst.totalClearStake()).toString()
                );

                var balanceBefore = await web3.eth.getBalance(anotherAccount3);
                var receipt5 = await this.joysStakingInst.deposit({from: anotherAccount5, value: (new BN(minimalStake)).mul(new BN("3"))});
                var balanceAfter = await web3.eth.getBalance(anotherAccount3);
                var freezedTimestamp3 = (await web3.eth.getBlock('latest')).timestamp;

                // check balances
                await assert.equal(
                    await web3.eth.getBalance(this.joysStakingInst.address),
                    (await this.joysStakingInst.totalClearStake()).toString()
                );                
                
                var passedTime = freezedTimestamp3 - freezedTimestamp1;
                var rewarded = (new BN(REVARD_PER_SECOND)).mul(new BN(passedTime));
                await assert.equal(
                    balanceAfter.toString(),
                    (new BN(balanceBefore)).add(new BN(minimalStake)).add(rewarded).toString()
                );

                expectEvent(receipt5, 'Deposit', {
                    user: anotherAccount5,
                    value: (new BN(minimalStake)).mul(new BN("3")).toString(),
                    timestamp: freezedTimestamp3.toString()
                });
                expectEvent(receipt5, 'AddStakeholder', {
                    target: anotherAccount5,
                    value: (new BN(minimalStake)).mul(new BN("3")).toString(),
                    timestamp: freezedTimestamp3.toString()
                });
                expectEvent(receipt5, 'RemoveStakeholder', {
                    target: anotherAccount3,
                    value: (new BN(minimalStake)).add(rewarded).toString(),
                    timestamp: freezedTimestamp3.toString()
                });
                expectEvent(receipt5, 'Transfer', {
                    target: anotherAccount3,
                    value: (new BN(minimalStake)).add(rewarded).toString(),
                    timestamp: freezedTimestamp3.toString()
                });
                expectEvent(receipt5, 'Drop', {
                    from: anotherAccount5,
                    to: anotherAccount3,
                    value: (new BN(minimalStake)).add(rewarded).toString(),
                    timestamp: freezedTimestamp3.toString()
                });
                
                var timeJump = await (freezedTimestamp1 + 1);
                await advanceBlockAndSetTime(timeJump);

                // check balances
                await assert.equal(
                    await web3.eth.getBalance(this.joysStakingInst.address),
                    (await this.joysStakingInst.totalClearStake()).toString()
                );

                await assert.equal(
                    (await this.joysStakingInst.stakeOf(anotherAccount3)).toString(),
                    "0"
                );
                await assert.equal(
                    (await this.joysStakingInst.expectedReward(anotherAccount3)).toString(),
                    "0"
                );
                await assert.equal(
                    (await this.joysStakingInst.clearStakeOf(anotherAccount3)).toString(),
                    "0"
                );
                await assert.equal(
                    (await this.joysStakingInst.totalClearStake()).toString(),
                    (new BN(minimalStake)).mul(new BN("11")).toString()
                );
                await assert.equal(
                    await this.joysStakingInst.isStakeholder(anotherAccount3),
                    false
                );
                await assert.equal(
                    (await this.joysStakingInst.totalStakeholders()).toString(),
                    "4"
                );
                await assert.equal(
                    (await this.joysStakingInst.stakeholders()).length,
                    "4"
                );
                var worstStakeholder = await this.joysStakingInst.worstStakeholder();
                await assert.equal(
                    worstStakeholder[0],
                    anotherAccount1
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(GUARD),
                    anotherAccount1
                );
            });
        })
        describe('negative', function () {
            it('zero msg.value', async function () { 
                await expectRevert(
                    this.joysStakingInst.deposit({from: anotherAccount1, value: "0"}),
                    'JoysStaking: value must not be zero',
                );
            });
            it('missing deposit', async function () { 
                await expectRevert(
                    this.joysStakingInst.deposit({from: anotherAccount1, value: (new BN(minimalStake)).sub(new BN(1))}),
                    'JoysStaking: amount in staking must be greater than fixed minimum',
                );
            });
            it('missing deposit', async function () { 
                await this.joysStakingInst.deposit({from: anotherAccount1, value: minimalStake});
                await this.joysStakingInst.deposit({from: anotherAccount2, value: minimalStake});
                await this.joysStakingInst.deposit({from: anotherAccount3, value: minimalStake});
                await this.joysStakingInst.deposit({from: anotherAccount4, value: minimalStake});
                await expectRevert(
                    this.joysStakingInst.deposit({from: anotherAccount5, value: minimalStake}),
                    'JoysStaking: stakepool is full. Your stake must be higher than of the worst staker',
                );
            });
        });
    });


    describe('withdraw', function () {
        beforeEach(async function () {
            await checkEmptyStakeholder(anotherAccount1, this.joysStakingInst);
            this.depositedStake = await ((new BN(minimalStake)).add((new BN(minimalStake)).div(new BN(2))));
            await this.joysStakingInst.deposit({from: anotherAccount1, value: this.depositedStake});
            this.freezedTimestamp1 = (await web3.eth.getBlock('latest')).timestamp;

            await assert.equal(
                await web3.eth.getBalance(this.joysStakingInst.address),
                (await this.joysStakingInst.totalClearStake()).toString()
            );
        });
        describe('positive', function () {
            it('part-single', async function () {
                var withdrawAmount = await (new BN(minimalStake)).div(new BN(2));

                var balanceBefore = await web3.eth.getBalance(anotherAccount1);
                var receipt1 = await this.joysStakingInst.withdraw(withdrawAmount, {from: anotherAccount1});
                var freezedTimestamp2 = (await web3.eth.getBlock('latest')).timestamp;

                await assert.equal(
                    await web3.eth.getBalance(this.joysStakingInst.address),
                    (await this.joysStakingInst.totalClearStake()).toString()
                );

                var passedTime = freezedTimestamp2 - this.freezedTimestamp1;
                var rewarded = (new BN(REVARD_PER_SECOND)).mul(new BN(passedTime));

                var eventTime = await freezedTimestamp2.toString();
                expectEvent(receipt1, 'Withdraw', {
                    user: anotherAccount1,
                    value: new BN(withdrawAmount),
                    timestamp: eventTime
                });
                expectEvent(receipt1, 'DecreaseStakeholder', {
                    target: anotherAccount1,
                    value: new BN(withdrawAmount),
                    timestamp: eventTime
                });
                expectEvent(receipt1, 'Transfer', {
                    target: anotherAccount1,
                    value: new BN(withdrawAmount),
                    timestamp: eventTime
                });
                expectEvent(receipt1, 'Receive', {
                    from: this.vaultInst.address,
                    value: rewarded,
                    timestamp: eventTime
                });

                var gasPrice = new BN((await web3.eth.getTransaction(receipt1.tx)).gasPrice)
                var fee = await (new BN(receipt1.receipt.gasUsed).mul(gasPrice));
                var balanceAfter = await web3.eth.getBalance(anotherAccount1);

                await assert.equal(
                    balanceAfter.toString(),
                    (new BN(balanceBefore)).add(withdrawAmount).sub(new BN(fee)).toString()
                );

                var timeJump = await (freezedTimestamp2 + 5);
                await advanceBlockAndSetTime(timeJump);
                
                var passedTime = passedTime + 5;
                var rewards = (new BN(REVARD_PER_SECOND)).mul(new BN(passedTime));
                var expected = new BN(REVARD_PER_SECOND).mul(new BN(5));

                var remainder = await this.depositedStake.sub(withdrawAmount);
                
                await assert.equal(
                    (await this.joysStakingInst.stakeOf(anotherAccount1)).toString(),
                    remainder.add(rewards).toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.expectedReward(anotherAccount1)).toString(),
                    expected.toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.rewardsOf(anotherAccount1)).toString(),
                    rewards.toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.clearStakeOf(anotherAccount1)).toString(),
                    remainder.add(rewarded).toString()
                );

                await assert.equal(
                    (await this.joysStakingInst.totalClearStake()).toString(),
                    remainder.add(rewarded).toString()
                );
                await assert.equal(
                    await this.joysStakingInst.isStakeholder(anotherAccount1),
                    true
                );
                await assert.equal(
                    (await this.joysStakingInst.totalStakeholders()).toString(),
                    "1"
                );
                await assert.equal(
                    (await this.joysStakingInst.stakeholders()).length,
                    "1"
                );
                var worstStakeholder = await this.joysStakingInst.worstStakeholder();
                await assert.equal(
                    worstStakeholder[0],
                    anotherAccount1
                );
                await assert.equal(
                    worstStakeholder[1],
                    remainder.add(rewards).toString()
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(GUARD),
                    anotherAccount1
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(anotherAccount1),
                    GUARD
                );
            });

            it('full-single', async function () {
                var withdrawAmount = await this.depositedStake;
                await advanceBlockAndSetTime(this.freezedTimestamp1 + 1);

                var balanceBefore = await web3.eth.getBalance(anotherAccount1);
                var receipt1 = await this.joysStakingInst.withdraw(withdrawAmount, {from: anotherAccount1});
                var freezedTimestamp2 = (await web3.eth.getBlock('latest')).timestamp;

                await assert.equal(
                    await web3.eth.getBalance(this.joysStakingInst.address),
                    (await this.joysStakingInst.totalClearStake()).toString()
                );

                var passedTime = freezedTimestamp2 - this.freezedTimestamp1;
                var rewarded = (new BN(REVARD_PER_SECOND)).mul(new BN(passedTime));

                var eventTime = await freezedTimestamp2.toString();
                expectEvent(receipt1, 'Withdraw', {
                    user: anotherAccount1,
                    value: new BN(withdrawAmount).add(rewarded),
                    timestamp: eventTime
                });
                expectEvent(receipt1, 'RemoveStakeholder', {
                    target: anotherAccount1,
                    value: new BN(withdrawAmount).add(rewarded),
                    timestamp: eventTime
                });
                expectEvent(receipt1, 'Transfer', {
                    target: anotherAccount1,
                    value: new BN(withdrawAmount).add(rewarded),
                    timestamp: eventTime
                });
                expectEvent(receipt1, 'Receive', {
                    from: this.vaultInst.address,
                    value: rewarded,
                    timestamp: eventTime
                });

                var gasPrice = new BN((await web3.eth.getTransaction(receipt1.tx)).gasPrice)
                var fee = await (new BN(receipt1.receipt.gasUsed).mul(gasPrice));
                var balanceAfter = await web3.eth.getBalance(anotherAccount1);
                await assert.equal(
                    balanceAfter.toString(),
                    (new BN(balanceBefore)).add(withdrawAmount).add(rewarded).sub(fee).toString()
                );
                
                var timeJump = await (freezedTimestamp2 + 5);
                await advanceBlockAndSetTime(timeJump);

                await assert.equal(
                    await web3.eth.getBalance(this.joysStakingInst.address),
                    (await this.joysStakingInst.totalClearStake()).toString()
                );

                var remainder = new BN(0);
                
                await assert.equal(
                    (await this.joysStakingInst.stakeOf(anotherAccount1)).toString(),
                    remainder.toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.expectedReward(anotherAccount1)).toString(),
                    remainder.toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.rewardsOf(anotherAccount1)).toString(),
                    rewarded.toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.clearStakeOf(anotherAccount1)).toString(),
                    remainder.toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.totalClearStake()).toString(),
                    remainder.toString()
                );
                await assert.equal(
                    await this.joysStakingInst.isStakeholder(anotherAccount1),
                    false
                );
                await assert.equal(
                    (await this.joysStakingInst.totalStakeholders()).toString(),
                    "0"
                );
                await assert.equal(
                    (await this.joysStakingInst.stakeholders()).length,
                    "0"
                );
                var worstStakeholder = await this.joysStakingInst.worstStakeholder();
                await assert.equal(
                    worstStakeholder[0],
                    ZERO_ADDRESS
                );
                await assert.equal(
                    worstStakeholder[1],
                    "0"
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(GUARD),
                    GUARD
                );
            });

            it('overlimit-single', async function () {
                var withdrawAmount = await (this.depositedStake.sub(new BN(minimalStake)).add((new BN(REVARD_PER_SECOND)).mul(new BN("2"))));
                  
                var balanceBefore = await web3.eth.getBalance(anotherAccount1);

                var receipt1 = await this.joysStakingInst.withdraw(withdrawAmount, {from: anotherAccount1});
                var freezedTimestamp2 = (await web3.eth.getBlock('latest')).timestamp;

                await assert.equal(
                    await web3.eth.getBalance(this.joysStakingInst.address),
                    (await this.joysStakingInst.totalClearStake()).toString()
                );

                var passedTime = freezedTimestamp2 - this.freezedTimestamp1;
                var rewarded = (new BN(REVARD_PER_SECOND)).mul(new BN(passedTime));

                var balanceAfter = await web3.eth.getBalance(anotherAccount1);
                var gasPrice = new BN((await web3.eth.getTransaction(receipt1.tx)).gasPrice)
                var fee = await (new BN(receipt1.receipt.gasUsed).mul(gasPrice));

                await assert.equal(
                    balanceAfter.toString(),
                    (new BN(balanceBefore)).add(this.depositedStake).add(rewarded).sub(new BN(fee)).toString()
                );

                var timeJump = await (5 + this.freezedTimestamp1);
                await advanceBlockAndSetTime(timeJump);

                await assert.equal(
                    await web3.eth.getBalance(this.joysStakingInst.address),
                    (await this.joysStakingInst.totalClearStake()).toString()
                );
                
                var eventTime = await freezedTimestamp2.toString();
                expectEvent(receipt1, 'Withdraw', {
                    user: anotherAccount1,
                    value: this.depositedStake.add(rewarded),
                    timestamp: eventTime
                });
                expectEvent(receipt1, 'RemoveStakeholder', {
                    target: anotherAccount1,
                    value: this.depositedStake.add(rewarded),
                    timestamp: eventTime
                });
                expectEvent(receipt1, 'Transfer', {
                    target: anotherAccount1,
                    value: this.depositedStake.add(rewarded),
                    timestamp: eventTime
                });

                expectEvent(receipt1, 'Receive', {
                    from: this.vaultInst.address,
                    value: rewarded,
                    timestamp: eventTime
                });

                var remainder = new BN(0);
                
                await assert.equal(
                    (await this.joysStakingInst.stakeOf(anotherAccount1)).toString(),
                    remainder.toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.expectedReward(anotherAccount1)).toString(),
                    remainder.toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.rewardsOf(anotherAccount1)).toString(),
                    rewarded.toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.clearStakeOf(anotherAccount1)).toString(),
                    remainder.toString()
                );
                await assert.equal(
                    (await this.joysStakingInst.totalClearStake()).toString(),
                    remainder.toString()
                );
                await assert.equal(
                    await this.joysStakingInst.isStakeholder(anotherAccount1),
                    false
                );
                await assert.equal(
                    (await this.joysStakingInst.totalStakeholders()).toString(),
                    "0"
                );
                await assert.equal(
                    (await this.joysStakingInst.stakeholders()).length,
                    "0"
                );
                var worstStakeholder = await this.joysStakingInst.worstStakeholder();
                await assert.equal(
                    worstStakeholder[0],
                    ZERO_ADDRESS
                );
                await assert.equal(
                    worstStakeholder[1],
                    "0"
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(GUARD),
                    GUARD
                );
            });

            it('rotate pool position', async function () {
                var withdrawAmount = await this.depositedStake;

                await this.joysStakingInst.deposit({from: anotherAccount2, value: (new BN(minimalStake)).mul(new BN("3"))});
                await this.joysStakingInst.deposit({from: anotherAccount3, value: (new BN(minimalStake)).mul(new BN("4"))});
                await this.joysStakingInst.deposit({from: anotherAccount4, value: (new BN(minimalStake)).mul(new BN("2"))});

                await this.joysStakingInst.withdraw(withdrawAmount, {from: anotherAccount1});

                await assert.equal(
                    await web3.eth.getBalance(this.joysStakingInst.address),
                    (await this.joysStakingInst.totalClearStake()).toString()
                );

                var worstStakeholder = await this.joysStakingInst.worstStakeholder();
                await assert.equal(
                    worstStakeholder[0],
                    anotherAccount4
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(GUARD),
                    anotherAccount4
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(anotherAccount4),
                    anotherAccount2
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(anotherAccount2),
                    anotherAccount3
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(anotherAccount3),
                    GUARD
                );

                await this.joysStakingInst.withdraw((new BN(minimalStake)).mul(new BN("3")), {from: anotherAccount2});

                await assert.equal(
                    await web3.eth.getBalance(this.joysStakingInst.address),
                    (await this.joysStakingInst.totalClearStake()).toString()
                );

                var worstStakeholder = await this.joysStakingInst.worstStakeholder();
                await assert.equal(
                    worstStakeholder[0],
                    anotherAccount4
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(GUARD),
                    anotherAccount4
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(anotherAccount4),
                    anotherAccount3
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(anotherAccount3),
                    GUARD
                );

                await this.joysStakingInst.withdraw((new BN(minimalStake)).mul(new BN("4")), {from: anotherAccount3});

                await assert.equal(
                    await web3.eth.getBalance(this.joysStakingInst.address),
                    (await this.joysStakingInst.totalClearStake()).toString()
                );

                var worstStakeholder = await this.joysStakingInst.worstStakeholder();
                await assert.equal(
                    worstStakeholder[0],
                    anotherAccount4
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(GUARD),
                    anotherAccount4
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(anotherAccount4),
                    GUARD
                );

                await this.joysStakingInst.deposit({from: anotherAccount3, value: (new BN(minimalStake)).mul(new BN("4"))});

                await assert.equal(
                    await web3.eth.getBalance(this.joysStakingInst.address),
                    (await this.joysStakingInst.totalClearStake()).toString()
                );

                var worstStakeholder = await this.joysStakingInst.worstStakeholder();
                await assert.equal(
                    worstStakeholder[0],
                    anotherAccount4
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(GUARD),
                    anotherAccount4
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(anotherAccount4),
                    anotherAccount3
                );
                await assert.equal(
                    await this.joysStakingInst.getNextStakeholder(anotherAccount3),
                    GUARD
                );


            });
        });
        describe('negative', function () {
            it('zero amount', async function () { 
                await expectRevert(
                    this.joysStakingInst.withdraw("0", {from: anotherAccount1}),
                    'JoysStaking: amount must not be zero',
                );
            });
            it('must be stakeholder', async function () { 
                await expectRevert(
                    this.joysStakingInst.withdraw("1", {from: anotherAccount2}),
                    'JoysStaking: user must be a stakeholder',
                );
            });
            it('greater than real stake', async function () { 
                var stake = await this.joysStakingInst.stakeOf(anotherAccount1);
                await expectRevert(
                    this.joysStakingInst.withdraw(stake.mul(new BN(2)), {from: anotherAccount1}),
                    'JoysStaking: amount is greater than real stake',
                );
            });
        });
    });
 

})
