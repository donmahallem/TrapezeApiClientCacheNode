/*!
 * Source https://github.com/donmahallem/TrapezeApiClientNode
 */

import {
    IVehicleLocation,
    VehicleLocations,
} from "@donmahallem/trapeze-api-types";

export type TimestampedVehiclelocations = VehicleLocations & {
    lastUpdate: number,
};
export type TimestampedVehiclelocation = IVehicleLocation & {
    lastUpdate: number,
};
