/*!
 * Source https://github.com/donmahallem/TrapezeApiClientNode
 */

import { TrapezeApiClient } from "@donmahallem/trapeze-api-client";
import {
    IVehicleLocationList,
    VehicleId,
} from "@donmahallem/trapeze-api-types";
import { expect } from "chai";
import "mocha";
import * as sinon from "sinon";
import { NotFoundError } from "./not-found-error";
import { TimestampedVehiclelocation } from "./timestamped-location";
import { VehicleDb } from "./vehicle-db";
import {
    ISuccessStatus,
    LoadStatus,
    Status,
    VehicleStorage,
} from "./vehicle-storage";

describe("vehicle-storage.ts", () => {
    describe("VehicleStorage", () => {
        let instance: VehicleStorage;
        let sandbox: sinon.SinonSandbox;
        let getVehicleLocationsStub: sinon.SinonStub;
        let client: TrapezeApiClient;
        let clock: sinon.SinonFakeTimers;
        const clockNowTimestamp: number = 123456;
        let vehicleDb: sinon.SinonStubbedInstance<VehicleDb>;
        before("create Sandbox", () => {
            sandbox = sinon.createSandbox();
            getVehicleLocationsStub = sandbox.stub();
            clock = sandbox.useFakeTimers({
                now: clockNowTimestamp,
                shouldAdvanceTime: false,
            });
            vehicleDb = sandbox.createStubInstance(VehicleDb);
        });
        beforeEach(() => {
            client = {
                getVehicleLocations: getVehicleLocationsStub,
            } as any;
            instance = new VehicleStorage(client);
            (instance as any).mDb = vehicleDb;
        });

        afterEach("clear history", () => {
            sandbox.resetHistory();
        });
        after(() => {
            sandbox.restore();
            clock.restore();
        });
        describe("getVehicle(id)", () => {
            let fetchSuccessStub: sinon.SinonStub;
            const testError: Error = new Error("Test Error");
            const testData: ISuccessStatus = {
                lastUpdate: 235236,
                status: Status.SUCCESS,
                timestamp: 993,
            };
            beforeEach(() => {
                fetchSuccessStub = sandbox.stub(instance, "fetchSuccessOrThrow");
            });
            describe("fetch throws an error", () => {
                beforeEach(() => {
                    fetchSuccessStub.returns(Promise.reject(testError));
                });
                it("should pass the error on", () =>
                    instance.getVehicle("any id" as VehicleId)
                        .then(() => {
                            throw new Error("should not be called");
                        }, (err: any) => {
                            expect(err).to.deep.equal(testError);
                            expect(vehicleDb.getVehicleById.callCount).to.equal(0);
                        }));
            });
            describe("an unknown vehicle id is provided", () => {
                beforeEach(() => {
                    fetchSuccessStub.returns(Promise.resolve(testData));
                    vehicleDb.getVehicleById.returns(undefined);
                });
                it("should throw an NotFoundError", () =>
                    instance.getVehicle("any id" as VehicleId)
                        .then(() => {
                            throw new Error("should not be called");
                        }, (err: any | NotFoundError) => {
                            expect(err).to.instanceOf(NotFoundError);
                            expect(err.statusCode).to.equal(404);
                            expect(vehicleDb.getVehicleById.callCount).to.equal(1);
                            expect(vehicleDb.getVehicleById.getCall(0).args).to.deep.equal(["any id"]);
                        }));
            });
            describe("an known vehicle id is provided", () => {
                const testVehicle: any = {
                    id: "test_id",
                    lastUpdate: 9823,
                };
                beforeEach(() => {
                    fetchSuccessStub.returns(Promise.resolve(testData));
                    vehicleDb.getVehicleById.returns(testVehicle);
                });
                it("should return the id", () =>
                    instance.getVehicle("testId" as VehicleId)
                        .then((vehicle: TimestampedVehiclelocation) => {
                            expect(vehicle).to.deep.equal(testVehicle);
                            expect(vehicleDb.getVehicleById.callCount).to.equal(1);
                            expect(vehicleDb.getVehicleById.getCall(0).args).to.deep.equal(["testId"]);
                        }));
            });
        });
        describe("getVehicleByTripId(id)", () => {
            let fetchSuccessStub: sinon.SinonStub;
            const testError: Error = new Error("Test Error");
            const testData: ISuccessStatus = {
                lastUpdate: 235236,
                status: Status.SUCCESS,
                timestamp: 993,
            };
            beforeEach(() => {
                fetchSuccessStub = sandbox.stub(instance, "fetchSuccessOrThrow");
            });
            describe("fetch throws an error", () => {
                beforeEach(() => {
                    fetchSuccessStub.returns(Promise.reject(testError));
                });
                it("should pass the error on", () =>
                    instance.getVehicleByTripId("any id" as VehicleId)
                        .then(() => {
                            throw new Error("should not be called");
                        }, (err: any) => {
                            expect(err).to.deep.equal(testError);
                            expect(vehicleDb.getVehicleByTripId.callCount).to.equal(0);
                        }));
            });
            describe("an unknown vehicle id is provided", () => {
                beforeEach(() => {
                    fetchSuccessStub.returns(Promise.resolve(testData));
                    vehicleDb.getVehicleByTripId.returns(undefined);
                });
                it("should throw an NotFoundError", () =>
                    instance.getVehicleByTripId("any id" as VehicleId)
                        .then(() => {
                            throw new Error("should not be called");
                        }, (err: any | NotFoundError) => {
                            expect(err).to.instanceOf(NotFoundError);
                            expect(err.statusCode).to.equal(404);
                            expect(vehicleDb.getVehicleByTripId.callCount).to.equal(1);
                            expect(vehicleDb.getVehicleByTripId.getCall(0).args).to.deep.equal(["any id"]);
                        }));
            });
            describe("an known vehicle id is provided", () => {
                const testVehicle: any = {
                    id: "test_id",
                    lastUpdate: 9823,
                };
                beforeEach(() => {
                    fetchSuccessStub.returns(Promise.resolve(testData));
                    vehicleDb.getVehicleByTripId.returns(testVehicle);
                });
                it("should return the id", () =>
                    instance.getVehicleByTripId("testId" as VehicleId)
                        .then((vehicle: TimestampedVehiclelocation) => {
                            expect(vehicle).to.deep.equal(testVehicle);
                            expect(vehicleDb.getVehicleByTripId.callCount).to.equal(1);
                            expect(vehicleDb.getVehicleByTripId.getCall(0).args).to.deep.equal(["testId"]);
                        }));
            });
        });
        describe("getVehicles(left, right, top, bottom)", () => {
            let fetchSuccessStub: sinon.SinonStub;
            const testError: Error = new Error("Test Error");
            const testData: ISuccessStatus = {
                lastUpdate: 235236,
                status: Status.SUCCESS,
                timestamp: 993,
            };
            beforeEach(() => {
                fetchSuccessStub = sandbox.stub(instance, "fetchSuccessOrThrow");
            });
            describe("fetch throws an error", () => {
                beforeEach(() => {
                    fetchSuccessStub.returns(Promise.reject(testError));
                });
                it("should pass the error on", () =>
                    instance.getVehicles(1, 2, 2, 1)
                        .then(() => {
                            throw new Error("should not be called");
                        }, (err: any) => {
                            expect(err).to.deep.equal(testError);
                            expect(vehicleDb.getVehiclesIn.callCount).to.equal(0);
                        }));
            });
            describe("invalid parameter are provided", () => {
                it("should reject if left is not smaller than right", () =>
                    instance.getVehicles(1, 1, 1, 2)
                        .then(() => {
                            throw new Error("should not be called");
                        }, (err: any) => {
                            expect(err).to.be.instanceOf(Error);
                            expect(err.message).to.equal("left must be smaller than right");
                            expect(vehicleDb.getVehiclesIn.callCount).to.equal(0);
                        }));
                it("should reject if bottom is not smaller than top", () =>
                    instance.getVehicles(1, 2, 2, 2)
                        .then(() => {
                            throw new Error("should not be called");
                        }, (err: any) => {
                            expect(err).to.be.instanceOf(Error);
                            expect(err.message).to.equal("top must be greater than bottom");
                            expect(vehicleDb.getVehiclesIn.callCount).to.equal(0);
                        }));
            });
            describe("vehicles bounds are provided", () => {
                const testResponse: any = {
                    data: "response",
                    data2: 2,
                };
                beforeEach(() => {
                    fetchSuccessStub.returns(Promise.resolve(testData));
                    vehicleDb.getVehiclesIn.returns(testResponse);
                });
                it("should pass on arguments correctly", () =>
                    instance.getVehicles(20, 22, 2, 1)
                        .then((vehicle: IVehicleLocationList) => {
                            expect(vehicle).to.deep.equal({
                                lastUpdate: testData.lastUpdate,
                                vehicles: testResponse,
                            });
                            expect(vehicleDb.getVehiclesIn.callCount).to.equal(1);
                            expect(vehicleDb.getVehiclesIn.getCall(0).args).to.deep.equal([20, 22, 2, 1, 0]);
                        }));
                it("should pass on optional arguments correctly", () =>
                    instance.getVehicles(20, 22, 2, 1, 10)
                        .then((vehicle: IVehicleLocationList) => {
                            expect(vehicle).to.deep.equal({
                                lastUpdate: testData.lastUpdate,
                                vehicles: testResponse,
                            });
                            expect(vehicleDb.getVehiclesIn.callCount).to.equal(1);
                            expect(vehicleDb.getVehiclesIn.getCall(0).args).to.deep.equal([20, 22, 2, 1, 10]);
                        }));
            });
        });
        describe("status", () => {
            describe("getter", () => {
                [1, 2, 3].forEach((testValue: number): void => {
                    it("should return the private mStatus with value '" + testValue + "'", () => {
                        (instance as any).mStatus = testValue;
                        expect(instance.status).to.equal(testValue);
                    });
                });
            });
        });
        describe("getAllVehicles(since?)", () => {
            let fetchSuccessStub: sinon.SinonStub;
            const testError: Error = new Error("Test Error");
            const testData: ISuccessStatus = {
                lastUpdate: 235236,
                status: Status.SUCCESS,
                timestamp: 993,
            };
            beforeEach(() => {
                fetchSuccessStub = sandbox.stub(instance, "fetchSuccessOrThrow");
            });
            describe("fetch throws an error", () => {
                beforeEach(() => {
                    fetchSuccessStub.rejects(testError);
                });
                it("should pass the error on", () =>
                    instance.getAllVehicles()
                        .then(() => {
                            throw new Error("should not be called");
                        }, (err: any) => {
                            expect(err).to.deep.equal(testError);
                            expect(vehicleDb.getVehicles.callCount).to.equal(0);
                        }));
            });
            describe("fetch returns success", () => {
                beforeEach(() => {
                    fetchSuccessStub.resolves(testData);
                    vehicleDb.getVehicles.returns([1, 2, 3] as any);
                });
                it("should call correctly with default", () =>
                    instance.getAllVehicles().
                        then((value) => {
                            expect(value).to.deep.equal({
                                lastUpdate: 235236,
                                vehicles: [1, 2, 3],
                            });
                            expect(vehicleDb.getVehicles.getCall(0).args).to.deep.equal([0]);
                            expect(vehicleDb.getVehicles.callCount).to.equal(1);
                        }));
                it("should call correctly with non default", () =>
                    instance.getAllVehicles(1234).
                        then((value) => {
                            expect(value).to.deep.equal({
                                lastUpdate: 235236,
                                vehicles: [1, 2, 3],
                            });
                            expect(vehicleDb.getVehicles.callCount).to.equal(1);
                            expect(vehicleDb.getVehicles.getCall(0).args).to.deep.equal([1234]);
                        }));
            });
        });
        describe("updateRequired()", () => {
            const testValues: Array<{ status: any, result: boolean, updateDelay: number }> = [
                {
                    result: true,
                    status: undefined,
                    updateDelay: 10000,
                },
                {
                    result: true,
                    // tslint:disable-next-line:no-null-keyword
                    status: null,
                    updateDelay: 10000,
                },
                {
                    result: false,
                    status: {
                        timestamp: clockNowTimestamp,
                    },
                    updateDelay: 10000,
                },
                {
                    result: true,
                    status: {
                        timestamp: "asdf",
                    },
                    updateDelay: 10000,
                }];
            [2000, 4000, 10000].forEach((delay: number): void => {
                testValues.push({
                    result: false,
                    status: {
                        timestamp: clockNowTimestamp - delay,
                    },
                    updateDelay: delay,
                });
                testValues.push({
                    result: false,
                    status: {
                        timestamp: clockNowTimestamp - delay + 1,
                    },
                    updateDelay: delay,
                });
                testValues.push({
                    result: true,
                    status: {
                        timestamp: clockNowTimestamp - delay - 1,
                    },
                    updateDelay: delay,
                });
            });
            testValues.forEach((testValue): void => {
                it("should return " + testValue.result + " for " + JSON.stringify(testValue.status)
                    + " and delay: " + testValue.updateDelay, () => {
                        (instance as any).updateDelay = testValue.updateDelay;
                        (instance as any).mStatus = testValue.status;
                        expect(instance.updateRequired()).to.equal(testValue.result);
                    });
            });
        });
        describe("fetch()", () => {
            const statusPrimer: any = {
                test: "status",
            };
            let updateStub: sinon.SinonStub;
            let lockedStub: sinon.SinonStub;
            beforeEach(() => {
                updateStub = sandbox.stub(instance, "updateRequired");
                (instance as any).mStatus = statusPrimer;
                lockedStub = sandbox.stub((instance as any).lock, "locked");
            });
            describe("no update is required", () => {
                beforeEach(() => {
                    updateStub.returns(false);
                });
                it("should resolve with the current status", () =>
                    instance.fetch()
                        .then((value: LoadStatus) => {
                            expect(value).to.deep.equal(statusPrimer);
                            expect(getVehicleLocationsStub.callCount).to.equal(0);
                            expect(vehicleDb.addResponse.callCount).to.equal(0);
                        }));
            });
            describe("file is locked", () => {
                let lockPromiseStub: sinon.SinonStub;
                beforeEach(() => {
                    updateStub.returns(true);
                    lockedStub.get(() => true);
                    lockPromiseStub = sandbox.stub((instance as any).lock, "promise");
                    lockPromiseStub.returns(Promise.resolve(1));
                    getVehicleLocationsStub.rejects();
                });
                it("should resolve after file is unlocked", () =>
                    instance.fetch()
                        .then((value: LoadStatus) => {
                            expect(lockPromiseStub.callCount).to.equal(1);
                            expect(getVehicleLocationsStub.callCount).to.equal(0);
                            expect(value).to.deep.equal(statusPrimer);
                            expect(vehicleDb.addResponse.callCount).to.equal(0);
                        }));
            });
            describe("refresh of data is required", () => {
                let lockedSetterSpy: sinon.SinonSpy;
                const testError = new Error("test error");
                before(() => {
                    lockedSetterSpy = sandbox.spy();
                });
                beforeEach(() => {
                    updateStub.returns(true);
                    lockedStub.get(() => false);
                    lockedStub.set(lockedSetterSpy);
                });
                describe("getVehicleLocation resolves", () => {
                    const testResponse: any = {
                        data: "any",
                        lastUpdate: 9582,
                        test: true,
                    };
                    beforeEach(() => {
                        getVehicleLocationsStub.resolves(testResponse);
                    });
                    it("should resolve after file is unlocked", () =>
                        instance.fetch()
                            .then((value: LoadStatus) => {
                                expect(vehicleDb.addResponse.callCount).to.equal(1);
                                expect(vehicleDb.addResponse.getCall(0).args).to.deep.equal([testResponse]);
                                expect(getVehicleLocationsStub.callCount).to.equal(1);
                                expect(value).to.deep.equal({
                                    lastUpdate: 9582,
                                    status: Status.SUCCESS,
                                    timestamp: clockNowTimestamp,
                                });
                                expect(lockedSetterSpy.callCount).to.equal(2);
                                expect(lockedSetterSpy.args).to.deep.equal([[true], [false]]);
                            }));
                    it("should report error thrown inside response conversion", () => {
                        vehicleDb.addResponse.throws(testError);
                        return instance.fetch()
                            .then((value: LoadStatus) => {
                                expect(vehicleDb.addResponse.callCount).to.equal(1);
                                expect(vehicleDb.addResponse.getCall(0).args).to.deep.equal([testResponse]);
                                expect(getVehicleLocationsStub.callCount).to.equal(1);
                                expect(value).to.deep.equal({
                                    error: testError,
                                    lastUpdate: 0,
                                    status: Status.ERROR,
                                    timestamp: clockNowTimestamp,
                                });
                                expect(lockedSetterSpy.callCount).to.equal(2);
                                expect(lockedSetterSpy.args).to.deep.equal([[true], [false]]);
                            });
                    });
                    it("should report error thrown inside response conversion with prior timestamp", () => {
                        vehicleDb.addResponse.throws(testError);
                        (instance as any).mStatus = {
                            lastUpdate: 5432,
                        };
                        return instance.fetch()
                            .then((value: LoadStatus) => {
                                expect(vehicleDb.addResponse.callCount).to.equal(1);
                                expect(vehicleDb.addResponse.getCall(0).args).to.deep.equal([testResponse]);
                                expect(getVehicleLocationsStub.callCount).to.equal(1);
                                expect(value).to.deep.equal({
                                    error: testError,
                                    lastUpdate: 5432,
                                    status: Status.ERROR,
                                    timestamp: clockNowTimestamp,
                                });
                                expect(lockedSetterSpy.callCount).to.equal(2);
                                expect(lockedSetterSpy.args).to.deep.equal([[true], [false]]);
                            });
                    });
                });
                describe("getVehicleLocation rejects", () => {
                    beforeEach(() => {
                        getVehicleLocationsStub.rejects(testError);
                    });
                    it("should resolve after file is unlocked", () =>
                        instance.fetch()
                            .then((value: LoadStatus) => {
                                expect(vehicleDb.addResponse.callCount).to.equal(0);
                                expect(getVehicleLocationsStub.callCount).to.equal(1);
                                expect(value).to.deep.equal({
                                    error: testError,
                                    lastUpdate: 0,
                                    status: Status.ERROR,
                                    timestamp: clockNowTimestamp,
                                });
                                expect(lockedSetterSpy.callCount).to.equal(2);
                                expect(lockedSetterSpy.args).to.deep.equal([[true], [false]]);
                            }));
                    it("should resolve after file is unlocked with old lastUpdate", () => {
                        (instance as any).mStatus = {
                            lastUpdate: 4857,
                        };
                        return instance.fetch()
                            .then((value: LoadStatus) => {
                                expect(vehicleDb.addResponse.callCount).to.equal(0);
                                expect(getVehicleLocationsStub.callCount).to.equal(1);
                                expect(value).to.deep.equal({
                                    error: testError,
                                    lastUpdate: 4857,
                                    status: Status.ERROR,
                                    timestamp: clockNowTimestamp,
                                });
                                expect(lockedSetterSpy.callCount).to.equal(2);
                                expect(lockedSetterSpy.args).to.deep.equal([[true], [false]]);
                            });
                    });
                });
            });
        });
        describe("fetchSuccessOrThrow()", () => {
            let fetchStub: sinon.SinonStub;
            const testError: Error = new Error("test error");
            beforeEach(() => {
                fetchStub = sinon.stub(instance, "fetch");
            });
            it("should throw the error from the status retrieved from fetch()", () => {
                fetchStub.returns(Promise.resolve({
                    error: testError,
                    status: Status.ERROR,
                }));
                return instance.fetchSuccessOrThrow()
                    .then(() => {
                        throw new Error("should not have been called");
                    }, (err: any) => {
                        expect(err).to.deep.equal(testError);
                    });
            });
            it("should resolve with the successful state from fetch()", () => {
                const successStatus: any = {
                    error: testError,
                    status: Status.SUCCESS,
                };
                fetchStub.returns(Promise.resolve(successStatus));
                return instance.fetchSuccessOrThrow()
                    .then((value) => {
                        expect(value).to.deep.equal(successStatus);
                    });
            });
            it("should throw error if no value is resolved", () => {
                fetchStub.returns(Promise.resolve());
                return instance.fetchSuccessOrThrow()
                    .then(() => {
                        throw new Error("should not have been called");
                    }, (err: any | Error) => {
                        expect(err).to.be.instanceOf(Error);
                        expect(err.message).to.equal("No status provided");
                    });
            });
        });
    });
});
