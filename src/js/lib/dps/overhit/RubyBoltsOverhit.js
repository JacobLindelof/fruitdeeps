import { Overhit } from "./Overhit.js";

export class RubyBoltsOverhit extends Overhit {
    timeToKill(hp) {
        const m1 = this.calcs.maxHit

        const specChance = this.calcs.specChance
        const accuracy = this.calcs.rawAcc
        const speed = this.calcs.attackSpeed

        const corp = this.calcs.flags.includes("Corporeal beast");

        const dist = Array(m1 + 1).fill(0)
        let hitSum = 0

        if (typeof this.generalMemory[hp - 1] === 'undefined') {
            this.fillMemory(hp)
        }

        //populate hit distribution lookup table
        for (let h1 = 1; h1 <= m1; h1 += 1) {
            dist[h1] += (1 - specChance) * accuracy / (m1 + 1)
            hitSum += dist[h1]
        }

        hitSum += specChance


        let sum = 0
        let spec = Math.trunc(hp / 5)
        if (corp) {
            spec = Math.trunc(spec / 2);
        }
        spec = Math.min(100, spec);

        for (let hit = 1; hit <= m1; hit += 1) {
            if (corp) {
                sum += this.getStep(hp - Math.trunc(hit / 2)) * dist[hit]
            } else {
                sum += this.getStep(hp - hit) * dist[hit]
            }

        }

        let ttk = 0
        if (spec === 0) {
            ttk = (sum + speed) / (hitSum - specChance)
        } else {
            ttk = (this.getStep(hp - spec) * specChance + sum + speed) / (hitSum)
        }
        this.generalMemory[hp] = ttk
        return ttk
    }
}