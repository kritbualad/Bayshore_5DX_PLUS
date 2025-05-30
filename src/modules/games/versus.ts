import { prisma } from "../..";

// Import Proto
import { wm5 } from "../../wmmt/wm5.proto";

// Import Util
import * as common from "../util/common";


// Save versus battle result
export async function saveVersusBattleResult(body: wm5.protobuf.SaveGameResultRequest, car: any)
{
    // Not retired
    if (!(body.retired)) 
    {
        // Get the vs result for the car
        let vsResult = body?.vsResult;

        // vs result is set
        if (vsResult)
        {
            console.log(vsResult);

            // vs result update data
            let data : any = {
                vsPlayCount: common.sanitizeInput(vsResult.vsPlayCount), 
                vsBurstCount: common.sanitizeInput(vsResult.vsBurstCount), 
                vsStarCount: common.sanitizeInputNotZero(vsResult.vsStarCount), 
                vsCoolOrWild: common.sanitizeInput(vsResult.vsCoolOrWild),
                vsSmoothOrRough: common.sanitizeInput(vsResult.vsSmoothOrRough), 
                vsTripleStarMedals: common.sanitizeInputNotZero(vsResult.vsTripleStarMedals),
                vsDoubleStarMedals: common.sanitizeInputNotZero(vsResult.vsDoubleStarMedals), 
                vsSingleStarMedals: common.sanitizeInputNotZero(vsResult.vsSingleStarMedals), 
                vsPlainMedals: common.sanitizeInputNotZero(vsResult.vsPlainMedals), 
            }

            // If the current versus star count is greater than the maximum
            if (data.vsStarCount && (car.vsStarCountMax < data.vsStarCount))
            {
                // Update the maximum versus star count
                data.vsStarCountMax = data.vsStarCount;
            }

            await prisma.car.update({
                where: {
                    carId: body.carId
                },
                data: data
            });
        }
    }
}