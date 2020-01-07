/*!
 * Source https://github.com/donmahallem/TrapezeApiClientNode
 */

import { IVehicleLocationExtended } from "@donmahallem/trapeze-api-client-types";
import {
    IVehicleLocation,
    IVehicleLocationList,
    TripId,
    VehicleId,
} from "@donmahallem/trapeze-api-types";

type VehicleIdMap = Map<VehicleId, IVehicleLocationExtended>;
export class VehicleDb {
    private mVehicles: IVehicleLocationExtended[] = [];
    private mLastUpdate: number = 0;
    public constructor(public ttl: number = 0) {

    }
    public get lastUpdate(): number {
        return this.mLastUpdate;
    }
    /**
     *
     * @param vehicleResponse
     * @since 3.0.0
     */
    public convertResponse(vehicleResponse: IVehicleLocationList): IVehicleLocationExtended[] {
        if (vehicleResponse && vehicleResponse.vehicles) {
            return vehicleResponse
                .vehicles
                .filter((value: IVehicleLocation): boolean => {
                    if (value === null || value === undefined) {
                        return false;
                    }
                    if (value.isDeleted === true) {
                        return true;
                    }
                    if (value.latitude === undefined || value.longitude === undefined) {
                        return false;
                    }
                    return true;
                })
                .map((value: IVehicleLocation): IVehicleLocationExtended =>
                    Object.assign({
                        lastUpdate: vehicleResponse.lastUpdate,
                    }, value));
        }
        return [];
    }
    /**
     *
     * @param resp
     * @since 3.0.0
     */
    public addResponse(resp: IVehicleLocationList): void {
        this.addAll(this.convertResponse(resp));
    }
    /**
     *
     * @param locations
     * @since 3.0.0
     */
    public addAll(locations: IVehicleLocationExtended[]): void {
        const dataMap: VehicleIdMap = this.mVehicles.concat(locations)
            .reduce<VehicleIdMap>((prev: VehicleIdMap, cur: IVehicleLocationExtended): VehicleIdMap => {
                if (prev.has(cur.id)) {
                    const curEntry: IVehicleLocationExtended | undefined = prev.get(cur.id);
                    if (curEntry && curEntry.lastUpdate >= cur.lastUpdate) {
                        return prev;
                    }
                }
                if (this.ttl <= 0 || cur.lastUpdate + this.ttl >= Date.now()) {
                    prev.set(cur.id, cur);
                }
                return prev;
            }, new Map<VehicleId, IVehicleLocationExtended>());
        this.mVehicles = Array.from(dataMap.values());
        this.mLastUpdate = this.mVehicles
            .reduce((prev: number, cur: IVehicleLocationExtended): number =>
                Math.max(prev, cur.lastUpdate), 0);

    }

    /**
     *
     * @param id
     * @since 3.0.0
     */
    public getVehicleById(id: VehicleId): IVehicleLocationExtended | undefined {
        const idx: number = this.mVehicles.findIndex((value: IVehicleLocationExtended): boolean =>
            value.id === id);
        return idx < 0 ? undefined : this.mVehicles[idx];
    }
    /**
     *
     * @param id
     * @since 3.0.0
     */
    public getVehicleByTripId(id: TripId): IVehicleLocationExtended | undefined {
        const idx: number = this.mVehicles.findIndex((value: IVehicleLocationExtended): boolean =>
            value.tripId === id);
        return idx < 0 ? undefined : this.mVehicles[idx];
    }

    /**
     *
     * @param since
     * @since 3.0.0
     */
    public getVehicles(since: number = 0): IVehicleLocationExtended[] {
        return this.mVehicles
            .filter((vehicle: IVehicleLocationExtended): boolean =>
                vehicle.lastUpdate >= since);
    }
    /**
     *
     * @param left
     * @param right
     * @param top
     * @param bottom
     * @param since
     * @since 3.0.0
     */
    public getVehiclesIn(left: number,
                         right: number,
                         top: number,
                         bottom: number,
                         since: number = 0): IVehicleLocationExtended[] {
        if (left >= right) {
            throw new Error("left must be smaller than right");
        }
        if (top <= bottom) {
            throw new Error("top must be greater than bottom");
        }
        return this.mVehicles
            .filter((vehicle: IVehicleLocationExtended): boolean => {
                if (vehicle.longitude < left || vehicle.longitude > right) {
                    return false;
                }
                if (vehicle.latitude < bottom || vehicle.latitude > top) {
                    return false;
                }
                return vehicle.lastUpdate >= since;
            });
    }
}
