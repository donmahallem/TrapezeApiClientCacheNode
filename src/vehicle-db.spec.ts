/*!
 * Source https://github.com/donmahallem/TrapezeApiClientNode
 */

import {
    IVehicleLocationList,
    TripId,
    VehicleId,
} from "@donmahallem/trapeze-api-types";
import { expect } from "chai";
import "mocha";
import * as sinon from "sinon";
import { TimestampedVehiclelocation } from "./timestamped-location";
import { VehicleDb } from "./vehicle-db";
type PartialLocation = Partial<TimestampedVehiclelocation>;
/**
 * Helper method
 * @param ins
 * @param vehicles
 */
const setVehicles: (ins: VehicleDb, vehicles: Array<Partial<TimestampedVehiclelocation>>) => void =
    (ins: VehicleDb, vehicles: any[]): void => {
        (ins as any).mVehicles = vehicles;
    };
const getVehicles: (ins: VehicleDb) => PartialLocation[] = (ins: VehicleDb): PartialLocation[] =>
    (ins as any).mVehicles;
describe("vehicle-db.ts", () => {
    describe("VehicleDb", () => {
        let instance: VehicleDb;
        let sandbox: sinon.SinonSandbox;
        let clock: sinon.SinonFakeTimers;
        const clockNowTimestamp: number = 123456;
        before("create Sandbox", () => {
            sandbox = sinon.createSandbox();
            clock = sandbox.useFakeTimers({
                now: clockNowTimestamp,
                shouldAdvanceTime: false,
            });
        });
        beforeEach(() => {
            instance = new VehicleDb();
        });

        afterEach("clear history", () => {
            sandbox.resetHistory();
        });
        after(() => {
            sandbox.restore();
            clock.restore();
        });
        const testVehiclesId: PartialLocation[] = [
            { id: "any id1" as VehicleId },
            { id: 2939 as VehicleId },
        ];
        const testVehiclesTripId: PartialLocation[] = [
            { tripId: "any id2" as TripId },
            { tripId: 2969 as TripId },
        ];
        const testVehicles: PartialLocation[] = [1, 2, 3, 4, 5]
            .reduce((pre: PartialLocation[], cur: number) => {
                for (let i = 0; i < 5; i++) {
                    pre.push({
                        id: ("id" + i + cur) as VehicleId,
                        lastUpdate: clockNowTimestamp - 10 + (i * 5) + cur,
                        latitude: i,
                        longitude: cur,
                        tripId: ("trip" + i + cur) as TripId,
                    });
                }
                return pre;
            }, []);
        describe("getVehicles(lastUpdate)", () => {
            it("should return all items", () => {
                setVehicles(instance, testVehicles);
                expect(instance.getVehicles()).to.deep.equal(testVehicles);
            });
            it("should return all items", () => {
                setVehicles(instance, testVehicles);
                const result: any[] = instance.getVehicles(clockNowTimestamp + 10);
                expect(result).to.have.lengthOf(6);
                [
                    {
                        id: "id35",
                        lastUpdate: 123466,
                        latitude: 3,
                        longitude: 5,
                        tripId: "trip35",
                    }, {
                        id: "id41",
                        lastUpdate: 123467,
                        latitude: 4,
                        longitude: 1,
                        tripId: "trip41",
                    }, {
                        id: "id42",
                        lastUpdate: 123468,
                        latitude: 4,
                        longitude: 2,
                        tripId: "trip42",
                    }, {
                        id: "id43",
                        lastUpdate: 123469,
                        latitude: 4,
                        longitude: 3,
                        tripId: "trip43",
                    }, {
                        id: "id44",
                        lastUpdate: 123470,
                        latitude: 4,
                        longitude: 4,
                        tripId: "trip44",
                    }, {
                        id: "id45",
                        lastUpdate: 123471,
                        latitude: 4,
                        longitude: 5,
                        tripId: "trip45",
                    },
                ].forEach((val) => {
                    expect(result).to.deep.include(val, "result must include: " + JSON.stringify(val));
                });
            });
        });
        describe("getVehicleById(id)", () => {
            it("should return undefined if no item is in the list", () => {
                setVehicles(instance, []);
                expect(instance.getVehicleById("id1" as VehicleId)).to.equal(undefined);
            });
            it("should return undefined if the queried id is unknown", () => {
                setVehicles(instance, testVehiclesId);
                expect(instance.getVehicleById("id1" as VehicleId)).to.equal(undefined);
            });
            testVehiclesId.forEach((val: PartialLocation) => {
                it("should return element with id '" + val.id + "' if the queried id is unknown", () => {
                    setVehicles(instance, testVehiclesId);
                    expect(instance.getVehicleById(val.id as VehicleId)).to.deep.equal(val);
                });
            });
        });
        describe("lastUpdate", () => {
            it("should return the lastUpdate value", () => {
                (instance as any).mLastUpdate = 1337;
                expect(instance.lastUpdate).to.equal(1337);
            });
        });
        describe("addAll(locations)", () => {
            [0, 1].forEach((ttl) => {
                describe("ttl is " + (ttl > 0 ? "greater " : "") + "0", () => {
                    beforeEach(() => {
                        instance.ttl = ttl;
                    });
                    afterEach(() => {
                        const highestValue: number = getVehicles(instance)
                            .reduce((prev, cur: any) =>
                                Math.max(prev, cur.lastUpdate), 0);
                        expect((instance as any).mLastUpdate).to.equal(highestValue);
                    });
                    it("should only drop timed out elements if provided empty array and populated before", () => {
                        setVehicles(instance, testVehicles);
                        expect(getVehicles(instance)).to.deep
                            .equal(testVehicles, "should contain vehicles before test");
                        instance.addAll([]);
                        expect(getVehicles(instance)).to.deep.equal(testVehicles.filter((value: any) => {
                            if (ttl === 0) {
                                return true;
                            }
                            return value.lastUpdate + 1 >= clockNowTimestamp;
                        }));
                    });
                    it("shouldn't do anything if provided empty array and not populated before", () => {
                        expect(getVehicles(instance)).to.have.lengthOf(0, "should contain vehicles before test");
                        instance.addAll([]);
                        expect(getVehicles(instance)).to.have.lengthOf(0);
                    });
                    it("should update items if provided non empty array and populated before", () => {
                        setVehicles(instance, testVehicles);
                        expect(getVehicles(instance)).to.have.lengthOf(testVehicles.length, "should contain vehicles before test");
                        instance.addAll([{
                            id: "id32",
                            lastUpdate: clockNowTimestamp + 50,
                        }] as any[]);
                        expect(getVehicles(instance)).to.have.lengthOf(ttl > 0 ? 17 : 25);
                        const expectedVehicles: any[] = testVehicles.filter((value: any) => {
                            if (ttl === 0) {
                                return true;
                            }
                            return value.lastUpdate + 1 >= clockNowTimestamp;
                        }).map((value) => {
                            if (value.id === "id32") {
                                return {
                                    id: "id32",
                                    lastUpdate: 123506,
                                };
                            } else {
                                return value;
                            }
                        });
                        expect(getVehicles(instance)).to.deep.equal(expectedVehicles);
                    });
                    it("should update no items if old items are provided", () => {
                        setVehicles(instance, testVehicles);
                        expect(getVehicles(instance)).to.have.lengthOf(testVehicles.length, "should contain vehicles before test");
                        instance.addAll(testVehicles
                            .map((value: any) => {
                                const a = Object.assign({}, value);
                                a.lastUpdate = a.lastUpdate - 200;
                                return a;
                            }) as any);
                        expect(getVehicles(instance)).to.have.lengthOf(ttl > 0 ? 17 : 25);
                        const expectedVehicles: any[] = testVehicles.filter((value: any) => {
                            if (ttl === 0) {
                                return true;
                            }
                            return value.lastUpdate + 1 >= clockNowTimestamp;
                        });
                        expect(getVehicles(instance)).to.deep.equal(expectedVehicles);
                    });
                    it("should remove deleted entries if they are newer", () => {
                        setVehicles(instance, testVehicles);
                        expect(getVehicles(instance)).to.have.lengthOf(testVehicles.length, "should contain vehicles before test");
                        instance.addAll([{
                            id: "id44",
                            isDeleted: true,
                            lastUpdate: clockNowTimestamp - 1000,
                        }, {
                            id: "id34",
                            isDeleted: true,
                            lastUpdate: clockNowTimestamp + 1000,
                        }] as any[]);
                        expect(getVehicles(instance)).to.have.lengthOf(ttl > 0 ? 16 : 24);
                        const expectedVehicles: any[] = testVehicles.filter((value: any) => {
                            if (value.id === "id34") {
                                return false;
                            }
                            if (ttl === 0) {
                                return true;
                            }
                            return value.lastUpdate + 1 >= clockNowTimestamp;
                        }).map((value) => {
                            if (value.id === "id34") {
                                const mapped = Object.assign({}, value);
                                mapped.lastUpdate = clockNowTimestamp + 1000;
                                return mapped;
                            }
                            return value;
                        });
                        expect(getVehicles(instance)).to.deep.equal(expectedVehicles);
                    });
                });
            });
        });
        describe("getVehicleByTripId(id)", () => {
            it("should return undefined if no item is in the list", () => {
                setVehicles(instance, []);
                expect(instance.getVehicleByTripId("id1" as TripId)).to.equal(undefined);
            });
            it("should return undefined if the queried id is unknown", () => {
                setVehicles(instance, testVehiclesTripId);
                expect(instance.getVehicleByTripId("id1" as TripId)).to.equal(undefined);
            });
            testVehiclesTripId.forEach((val: PartialLocation) => {
                it("should return element with tripId '" + val.tripId + "' if the queried id is unknown", () => {
                    setVehicles(instance, testVehiclesTripId);
                    expect(instance.getVehicleByTripId(val.tripId as TripId)).to.deep.equal(val);
                });
            });
        });
        describe("addResponse(resp)", () => {
            let addAllStub: sinon.SinonStub;
            let convertResponseStub: sinon.SinonStub;
            const testValue1: string = "test value 1";
            const testValue2: string = "test value 2";
            beforeEach(() => {
                addAllStub = sandbox.stub(instance, "addAll");
                convertResponseStub = sandbox.stub(instance, "convertResponse");
            });
            it("should call addAll with the result from convertResponse", () => {
                convertResponseStub.returns(testValue2);
                instance.addResponse(testValue1 as any);
                expect(addAllStub.callCount).to.equal(1, "addAll should only be called once");
                expect(convertResponseStub.callCount).to.equal(1, "convertResponse should only be called once");
                expect(addAllStub.calledWith(testValue2)).to.equal(true);
                expect(convertResponseStub.calledWith(testValue1)).to.equal(true);
            });
        });
        describe("convertResponse(result)", () => {
            const testData: IVehicleLocationList = {
                lastUpdate: 235236,
                vehicles: [
                    undefined,
                    // tslint:disable-next-line:no-null-keyword
                    null,
                    {
                        isDeleted: true,
                    },
                    {
                        id: "testId1",
                        latitude: 1,
                        tripId: "tripId1",
                    } as any,
                    {
                        id: "testId2",
                        longitude: 2,
                        tripId: "tripId2",
                    } as any,
                    {
                        id: "testId3",
                        latitude: 3,
                        longitude: 4,
                        tripId: "tripId3",
                    } as any,
                    {
                        id: "testId4",
                        isDeleted: true,
                    },
                ],
            };
            it("should parse the items correctly", () => {
                const result: any[] = instance.convertResponse(testData);
                expect(result.length).to.equal(4);
                expect(result.every((value) => value.lastUpdate === 235236)).to.equal(true);
                expect(result).to.deep.equal([{
                    id: "testId1",
                    isDeleted: true,
                    lastUpdate: 235236,
                }, {
                    id: "testId2",
                    isDeleted: true,
                    lastUpdate: 235236,
                }, {
                    id: "testId3",
                    lastUpdate: 235236,
                    latitude: 3,
                    longitude: 4,
                    tripId: "tripId3",
                }, {
                    id: "testId4",
                    isDeleted: true,
                    lastUpdate: 235236,
                }]);
            });
            it("should return empty array for an undefined parameter", () => {
                const result: any[] = instance.convertResponse(undefined as any);
                expect(result).to.have.lengthOf(0);
            });
            it("should return empty array for an undefined vehicles property", () => {
                const result: any[] = instance.convertResponse({} as any);
                expect(result).to.have.lengthOf(0);
            });
        });
        describe("getVehiclesIn(left, right, top, bottom, since)", () => {
            [undefined, clockNowTimestamp + 10]
                .forEach((useLastUpdate: any) => {
                    describe("lastUpdate argument " + (useLastUpdate ? "" : "not ") + "provided", () => {
                        describe("invalid parameter are provided", () => {
                            it("should reject if left is not smaller than right", () => {
                                expect(() => {
                                    instance.getVehiclesIn(1, 1, 1, 2, useLastUpdate as any);
                                }).to.throw("left must be smaller than right");
                            });
                            it("should reject if bottom is not smaller than top", () => {
                                expect(() => {
                                    instance.getVehiclesIn(1, 2, 2, 2, useLastUpdate as any);
                                }).to.throw("top must be greater than bottom");
                            });
                        });
                        const testData1: any[] = [
                            {
                                id: "id42",
                                lastUpdate: 123468,
                                latitude: 4,
                                longitude: 2,
                                tripId: "trip42",
                            }, {
                                id: "id43",
                                lastUpdate: 123469,
                                latitude: 4,
                                longitude: 3,
                                tripId: "trip43",
                            }, {
                                id: "id44",
                                lastUpdate: 123470,
                                latitude: 4,
                                longitude: 4,
                                tripId: "trip44",
                            }];
                        const testData2: any[] = testData1.concat([{
                            id: "id34",
                            lastUpdate: 123465,
                            latitude: 3,
                            longitude: 4,
                            tripId: "trip34",
                        }, {
                            id: "id33",
                            lastUpdate: 123464,
                            latitude: 3,
                            longitude: 3,
                            tripId: "trip33",
                        }, {
                            id: "id32",
                            lastUpdate: 123463,
                            latitude: 3,
                            longitude: 2,
                            tripId: "trip32",
                        }]);
                        it("should return only valid objects", () => {
                            setVehicles(instance, testVehicles);
                            const result: any[] = instance.getVehiclesIn(2, 4, 4, 3, useLastUpdate as any);
                            expect(result).to.have.lengthOf(useLastUpdate ? 3 : 6);
                            (useLastUpdate ? testData1 : testData2)
                                .forEach((val) => {
                                    expect(result).to.deep.contain(val);
                                });
                        });
                    });
                });
        });
    });
});
