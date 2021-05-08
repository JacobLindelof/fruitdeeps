export class SpecialWeapons {
    constructor(state, calcs) {
        this.state = state
        this.calcs = calcs
    }

    keris() {

        var dps = this.calcs
        const speed = dps.attackSpeed
        const acc = this.calcs.accuracy
        dps.baseMax = dps.maxHit
        dps.maxHit = Math.floor(dps.maxHit * 4 / 3)
        dps.maxHitSpec = dps.baseMax * 3

        let kerisDist = Array(dps.maxHitSpec + 1).fill(0);

        kerisDist[0] += 1 - acc

        for (let h1 = 0; h1 <= dps.maxHit; h1 += 1) {
            kerisDist[h1] += acc * 50 / 51 / (dps.maxHit + 1)
        }

        for (let h2 = 0; h2 <= dps.maxHitSpec; h2 += 1) {
            kerisDist[h2] += acc / 51 / (dps.maxHitSpec + 1)
        }

        dps.hitDistList[0] = kerisDist;

        return dps
    }

    //Dharok's set effect: Raises your damage according to your hp, after the damage roll
    dharoks() {
        const dps = this.calcs
        const currentHp = this.state.player.misc.currentHitpoints
        const baseHp = this.state.player.stats.hitpoints

        const hpMult = Math.max(1, 1 + (baseHp - currentHp) * baseHp / 10000)
        const max = Math.floor(dps.maxHit * hpMult)
        const oldDist = dps.hitDistList[0]
        const newDist = Array(max + 1).fill(0);

        for (let dmg = 0; dmg < oldDist.length; dmg++) {
            newDist[dmg * hpMult] = oldDist[dmg]
        }

        dps.maxHit = max
        dps.hitDistList[0] = newDist;

        return dps
    }


    //Verac's set effect: skips accuracy roll and adds 1 damage 25% of the time
    veracs() {
        const dps = this.calcs
        const specChance = 0.25
        const speed = dps.attackSpeed
        const acc = dps.accuracy
        const max = dps.maxHit
        const specMax = max + 1

        dps.maxHitSpec = dps.maxHit + 1

        const oldDist = dps.hitDistList[0]
        const newDist = Array(specMax + 1).fill(0);

        for (let dmg = 0; dmg < oldDist.length; dmg++) {
            newDist[dmg] += (1 - specChance) * oldDist[dmg]
        }

        for (let dmg = 0; dmg <= max; dmg++) {
            newDist[dmg + 1] += specChance / (max + 1)
        }

        dps.rawAcc = acc
        dps.accuracy = specChance + (1 - specChance) * dps.accuracy
        dps.specAcc = dps.accuracy
        dps.hitDistList[0] = newDist

        return dps
    }

    //Karils set effect: 25% chance of 50% extra damage
    karils() {
        const dps = this.calcs

        const m1 = dps.maxHit
        const m2 = Math.floor(dps.maxHit / 2)
        const mSum = m1 + m2

        const oldDist = dps.hitDistList[0];
        const newDist = Array(mSum + 1).fill(0);
        for (let dmg = 0; dmg < oldDist.length; dmg++) {
            newDist[dmg] += oldDist[dmg] * 0.75;
            newDist[Math.trunc(dmg * 3 / 2)] += oldDist[dmg] * 0.25
        }

        dps.hitDistList[0] = newDist;
        dps.maxList = [m1, m2];
        dps.maxHit = mSum
        return dps
    }

    //Ahrim's set effect: 25% chance to raise your max hit roll by 30%
    ahrims() {
        const dps = this.calcs
        const speed = dps.attackSpeed
        const m1 = dps.maxHit
        const m2 = Math.floor(dps.maxHit * 13 / 10)
        const acc = dps.accuracy


        const newDist = Array(m2 + 1).fill(0);
        newDist[0] = 1 - acc
        for (let dmg = 0; dmg <= m1; dmg++) {
            newDist[dmg] += acc * 0.75 / (m1 + 1);
        }
        for (let dmg = 0; dmg <= m2; dmg++) {
            newDist[dmg] += acc * 0.25 / (m2 + 1);
        }

        dps.hitDistList[0] = newDist;
        dps.maxHitSpec = m2
        return dps
    }

    generalBolt(bolt) {
        const ranged = this.state.player.boostedStats.ranged
        const boostTable = {
            "Enchanted pearl bolts": Math.floor(ranged / 20),
            "Enchanted opal bolts": Math.floor(ranged / 10),
            "Enchanted jade bolts": 0,
            "Enchanted pearl bolts fiery": Math.floor(ranged / 15),
            "Enchanted dragonstone bolts": Math.floor(ranged / 20)
        }

        const dps = this.calcs
        const acc = dps.accuracy
        const boost = boostTable[bolt]
        const m1 = dps.maxHit
        const m2 = m1 + boost

        let specChance = (bolt == "Enchanted opal bolts" ? 0.05 : 0.06)
        specChance = this.calcs.flags.includes("Kandarin hard diary") ? specChance * 11 / 10 : specChance


        const newDist = Array(m2 + 1).fill(0);
        newDist[0] += (1 - specChance) * (1 - acc)

        for (let dmg = 0; dmg <= m1; dmg++) {
            newDist[dmg] += (1 - specChance) * acc / (m1 + 1)
            newDist[dmg + boost] += specChance / (m1 + 1)
        }



        dps.hitDistList[0] = newDist
        //max hit of the spec
        dps.maxHitSpec = m2
        dps.rawAcc = acc
        //Accuracy when taking spec into account
        dps.accuracy = specChance + (1 - specChance) * dps.accuracy
        dps.specAcc = dps.accuracy
        return dps
    }

    rubyBolts() {
        const dps = this.calcs
        const hp = this.state.monster.stats.hitpoints
        let specDmg = Math.trunc(hp / 5)
        if (dps.flags.includes("Corporeal beast")) {
            specDmg = Math.trunc(specDmg / 2)
        }
        specDmg = Math.min(100, specDmg);
        const max = dps.maxHit
        const specChance = this.calcs.flags.includes("Kandarin hard diary") ? 0.066 : 0.06

        const oldDist = dps.hitDistList[0];
        const newDist = Array(Math.max(specDmg, max) + 1).fill(0);

        for (let dmg = 0; dmg < oldDist.length; dmg++) {
            newDist[dmg] += (1 - specChance) * oldDist[dmg];
        }

        newDist[specDmg] += specChance

        dps.specChance = specChance
        dps.hitDistList[0] = newDist;
        dps.maxHitSpec = specDmg
        dps.specAcc = specChance + (1 - specChance) * dps.accuracy
        return dps
    }

    diamondBolts() {
        const dps = this.calcs
        const specChance = this.calcs.flags.includes("Kandarin hard diary") ? 0.11 : 0.10
        const m1 = dps.maxHit
        const m2 = Math.floor(dps.maxHit * 23 / 20)
        const acc = dps.accuracy
        dps.specChance = specChance

        const newDist = Array(Math.max(m1, m2) + 1).fill(0)

        newDist[0] += (1 - acc) * (1 - specChance)

        for (let dmg = 0; dmg <= m1; dmg++) {
            newDist[dmg] += acc * (1 - specChance) / (m1 + 1)
        }

        for (let dmg = 0; dmg <= m2; dmg++) {
            newDist[dmg] += specChance / (m2 + 1)
        }


        dps.hitDistList[0] = newDist;
        dps.rawAcc = dps.accuracy
        dps.accuracy = specChance + (1 - specChance) * dps.accuracy
        dps.specAcc = dps.accuracy
        dps.maxHitSpec = m2
        return dps
    }

    onyxBolts() {
        const dps = this.calcs
        const specChance = this.calcs.flags.includes("Kandarin hard diary") ? 0.121 : 0.11
        const acc = dps.accuracy
        const m1 = dps.maxHit
        const m2 = Math.floor(dps.maxHit * 6 / 5)

        const newDist = Array(Math.max(m1, m2) + 1).fill(0);

        newDist[0] += 1 - acc

        for (dmg = 0; dmg <= m1; dmg++) {
            newDist[dmg] += acc * (1 - specChance) / (m1 + 1)
        }

        for (dmg = 0; dmg <= m2; dmg++) {
            newDist[dmg] += acc * specChance / (m2 + 1)
        }

        dps.hitDistList[0] = newDist
        dps.maxHitSpec = m2

        return dps
    }

    barbarianAssault() {
        const dps = this.calcs
        const m1 = dps.maxHit
        const rank = this.state.player.misc.baRank
        const m2 = m1 + rank

        for (var i = 0; i < dps.hitDistList.length; i++) {
            let dist = dps.hitDistList[i]
            let newDist = Array(dist.length + rank).fill(0)
            for (var dmg = 0; dmg < dist.length; dmg++) {
                newDist[dmg + rank] = dist[dmg];
            }
            dps.hitDistList[i] = newDist;
        }

        for (let hitNum = 0; hitNum < dps.maxList.length; hitNum++) {
            dps.maxList[hitNum] += rank;
        }

        return dps;
    }

    corporealBeast() {
        const dps = this.calcs;
        const oldDistList = dps.hitDistList

        const newDistList = []
        for (var i = 0; i < oldDistList.length; i++) {
            let oldDist = oldDistList[i]
            let newDist = Array(Math.trunc((oldDist.length + 1) / 2)).fill(0)
            for (let j = 0; j < oldDist.length; j++) {
                newDist[Math.trunc(j / 2)] += oldDist[j]
            }
            console.log(oldDist, newDist)
            newDistList.push(newDist);
        }
        dps.hitDistList = newDistList;
        for (let i = 0; i < dps.maxList.length; i++) {
            dps.maxList[i] = Math.trunc(dps.maxList[i] / 2)
        }

        return dps;
    }

    zulrah() {
        const dps = this.calcs;
        const oldDistList = dps.hitDistList

        const newDistList = [];

        for (var i = 0; i < oldDistList.length; i++) {
            let oldDist = oldDistList[i]
            let newDist = Array(Math.min(oldDist.length, 51)).fill(0)

            for (let dmg = 0; dmg < oldDist.length; dmg++) {
                if (dmg > 50) {
                    for (let roll = 0; roll <= 5; roll++) {
                        newDist[45 + roll] += oldDist[dmg] / 6
                    }
                } else {
                    newDist[dmg] += oldDist[dmg]
                }
            }
            newDistList.push(newDist);
        }

        dps.hitDistList = newDistList;

        for (let i = 0; i < dps.maxList.length; i++) {
            dps.maxList[i] = Math.min(50, dps.maxList[i])
        }

        if ("maxHitSpec" in dps && dps.maxHitSpec > 50) {
            dps.maxHitSpec = 50;
        }

        return dps
    }

    guardians() {

    }
}