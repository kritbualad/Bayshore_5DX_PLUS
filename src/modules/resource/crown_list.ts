import { prisma } from "../..";

//Import Proto
import wmsrv from "../../wmmt/service.proto";


// Get Crown List
export async function getCrownList()
{
    // Empty list of crown records
    let list_crown: wmsrv.wm5.protobuf.Crown[] = [];

    // Get the current date/time (unix epoch)
    let date = Math.floor(new Date().getTime() / 1000);

    // Get the crown holder data
    let car_crown = await prisma.carCrown.findMany({ 
        orderBy: {
            area: 'asc'
        },
    });
    
    // Crown holder data available
    if(car_crown.length !== 0)
    { 
        let counter = 0;

        // Loop GID_RUNAREA
        for(let i=0; i<19; i++)
        { 
            // 14 - 16 are dummy area, 17 is C1 Closed
            if(i >= 14)
            { 
                i = 18; // GID_RUNAREA_HIROSHIMA
            }

            // Crown holder for certain area available
            if(car_crown[counter].area === i)
            { 
                // Get user's data
                let car = await prisma.car.findFirst({
                    where: {
                        carId: car_crown[counter].carId
                    },
                    include: {
                        gtWing: true,
                        lastPlayedPlace: true
                    }
                });

                // If regionId is 0 or not set, game will crash after defeating the ghost
                if(car!.regionId === 0)
                {
                    car!.regionId = i + 1; // Change car region id
                }

                // Set the tunePower and tuneHandling used when capturing ghost crown
                car!.tunePower = car_crown[counter].tunePower; 
                car!.tuneHandling = car_crown[counter].tuneHandling; 

                // Error handling if played At timestamp value is current date and timestamp is bigger than 9 July 2022 (using GMT+7 timestamp)
                if(car_crown[counter].playedAt !== 0 && car_crown[counter].playedAt >= 1657299600)
                {
                    // Acquired crown timestamp - 1 day
                    car!.lastPlayedAt = car_crown[counter].playedAt - 172800;

                    // Acquired crown timestamp - 1 day
                    car_crown[counter].playedAt = car_crown[counter].playedAt - 172800;
                }
                // Error handling if played At timestamp value is 0 or timestamp is less than 9 July 2022 (using GMT+7 timestamp)
                else if(car_crown[counter].playedAt === 0 || car_crown[counter].playedAt < 1657299600)
                {
                    // Acquired crown timestamp become 9 July 2022 (using GMT+7 timestamp)
                    car!.lastPlayedAt = 1657299600;

                    // Acquired crown timestamp become 9 July 2022 (using GMT+7 timestamp)
                    car_crown[counter].playedAt = 1657299600;
                }

                // Push the car data to the crown holder data
                list_crown.push(wmsrv.wm5.protobuf.Crown.create({  
                    carId: car_crown[counter].carId,
                    area: car_crown[counter].area, // GID_RUNAREA_C1 - GID_RUNAREA_TURNPIKE & GID_RUNAREA_HIROSHIMA
                    unlockAt: car_crown[counter].playedAt,
                    car: car!
                }));

                if(counter < car_crown.length-1){
                    counter++;
                }
            }
            // Crown holder for certain area not available
            else
            { 
                // Push the default data by the game to the crown holder data
                list_crown.push(wmsrv.wm5.protobuf.Crown.create({ 
                    carId: 999999999-i,
                    area: i, // GID_RUNAREA_C1 - GID_RUNAREA_TURNPIKE & GID_RUNAREA_HIROSHIMA
                    unlockAt: date - 1000,
                }));
            }
        }
    }
    // There is no user's crown holder data available
    else
    { 
        // Loop GID_RUNAREA
        for(let i=0; i<19; i++)
        { 
            // After Kobe is Hiroshima then Fukuoka and the rest
            if(i > 14)
            { 
                i = 18; // GID_RUNAREA_HIROSHIMA
            }

            // Push the default data by the game to the crown holder data
            // GID_RUNAREA_HIROSHIMA
            if(i === 18)
            {
                let listCrown = wmsrv.wm5.protobuf.Crown.create({  
                    carId: 999999999-i,
                    area: i,
                    unlockAt: 0,
                });

                // Push it after Kobe
                list_crown.splice(11, 0, listCrown);
            }
            // GID_RUNAREA_C1 - GID_RUNAREA_TURNPIKE
            else
            {
                list_crown.push(wmsrv.wm5.protobuf.Crown.create({ 
                    carId: 999999999-i,
                    area: i,
                    unlockAt: 0,
                }));
            }
        }
    } 

    return { list_crown }
}