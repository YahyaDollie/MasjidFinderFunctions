/* eslint-disable valid-jsdoc */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */

import * as functions from "firebase-functions";
import axios from "axios";
import * as admin from "firebase-admin";
import {Client, GeocodeResponse} from "@googlemaps/google-maps-services-js";
import {GeolocationService} from "./services/GeolocationService";
// import {AreaGeolocation} from "./models/AreaGeolocation";
import {FirestoreService} from "./services/FirestoreService";
import {RealtimeDatabaseService} from "./services/RealtimeDatabaseService";
import {SalaahTimeRequests} from "./SalaahTimeRequests";
import {SalaahTime} from "./models/SalaahTime";
import {PredefinedLocations} from "./models/PredefinedLocations";
import moment from "moment-timezone";

admin.initializeApp();
const googleMaps = new Client({});
const realtimeDatabase = admin.database();

const salaahTimeRequests =
new SalaahTimeRequests();

const geolocationService =
new GeolocationService("AIzaSyCgK6O9xJIpjntal0ARJFm9noqxN4wHDXc", googleMaps);

const firestoreService =
new FirestoreService(new admin.firestore.Firestore, "masjid_cape_town");

const realtimeDatabaseService =
new RealtimeDatabaseService(realtimeDatabase);

export const getNearbyMosques = functions.https.onRequest(async (req, res) => {
  const currentLocation = req.query.currentLocation;
  const response = await geolocationService.getCoordinates(
    currentLocation as string);
  res.status(200).send(`Response: ${response.latitude}, ${response.longitude}`);
});

// export const writeLocationGeocodeTableToRealtimeDatabase =
// functions.https.onRequest(async (req, res) => {
//   const data = await getAreaList();
//   const result: { areas: AreaGeolocation[] } = {areas: []};
//   await Promise.all(
//       data.map(async (areaLocation) => {
//         try {
//           const geocode = await geolocationService.getCoordinates(areaLocation);
//           const resultObject: AreaGeolocation = {
//             area: areaLocation,
//             lat: geocode.latitude,
//             long: geocode.longitude,
//           };
//           result.areas.push(resultObject);
//         } catch (error) {
//           console.error(error as string);
//           const errorObject: AreaGeolocation = {
//             area: areaLocation,
//             lat: 0,
//             long: 0,
//           };
//           result.areas.push(errorObject);
//         }
//       })
//   );
//   realtimeDatabaseService.setValue("/", result);
//   res.status(200).send("Success");
// });

// async function AreaGeolocationTable(): Promise<{areas: AreaGeolocation[]}> {
//   const areaInLowercase = await getAreaList();
//   const resultJson: { areas: AreaGeolocation[] } = {areas: []};
//   await Promise.all(
//       areaInLowercase.map(async (str) => {
//         try {
//           const location = await geolocationService.getCoordinates(str);
//           const areaJson: AreaGeolocation = {
//             area: str,
//             lat: location.latitude,
//             long: location.longitude,
//           };
//           resultJson.areas.push(areaJson);
//         } catch (error) {
//           console.error(error as string);
//           const areaJson: AreaGeolocation = {
//             area: str,
//             lat: 1,
//             long: 1,
//           };
//           resultJson.areas.push(areaJson);
//         }
//       })
//   );
//   return resultJson;
// }

// export const constructAreaGeolocationTable = functions.https.onRequest(
//     async (req, res) => {
//       const areaInLowercase = await getAreaList();
//       const resultJson: { areas: AreaGeolocation[] } = {areas: []};
//       await Promise.all(
//           areaInLowercase.map(async (str) => {
//             try {
//               const location = await geolocationService.getCoordinates(str);
//               const areaJson: AreaGeolocation = {
//                 area: str,
//                 lat: location.latitude,
//                 long: location.longitude,
//               };
//               resultJson.areas.push(areaJson);
//             } catch (error) {
//               console.error(error as string);
//               const areaJson: AreaGeolocation = {
//                 area: str,
//                 lat: 1,
//                 long: 1,
//               };
//               resultJson.areas.push(areaJson);
//             }
//           })
//       );
//       res.json(resultJson);
//     });

export const getCoordinates = functions.https.onRequest(async (req, res) => {
  const address = req.query.address;

  try {
    const response: GeocodeResponse = await googleMaps.geocode({
      params: {
        address: address as string,
        key: "AIzaSyCgK6O9xJIpjntal0ARJFm9noqxN4wHDXc",
      },
    });

    console.log("Response:", response);

    const {lat, lng} = response.data.results[0].geometry.location;

    res.send({lat, lng});
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred");
  }
});

/**
 *
 * @return {Promise<string[]>}
 */
// async function getAreaList(): Promise<string[]> {
//   try {
//     const data = await firestoreService.getCollection();
//     const uniqueAreas = [...new Set(data.map((entry) => entry.area))];
//     const uniqueAreaObj = {areas: uniqueAreas};
//     const areaInLowercase = uniqueAreaObj.areas.map(
//         (area:string) => area.toLowerCase());
//     return areaInLowercase;
//   } catch (error) {
//     throw new Error("Error fetching firestore collection list");
//   }
// }

// async function getUniqueListOfAreas(): Promise<string[]> {
//   try {
//     const data = await firestoreService.getCollection();
//     const uniqueAreas = [...new Set(data.map((entry) => entry.area))];
//     const uniqueAreaObj = {areas: uniqueAreas};
//     const areaInLowercase = uniqueAreaObj.areas.map(
//         (area:string) => area.toLowerCase());
//     return areaInLowercase;
//   } catch (error) {
//     throw new Error("Error fetching firestore collection list");
//   }
// }

export const closestList = functions.https.onRequest(async (req, res) => {
  try {
    const data = await firestoreService.getCollection();
    const uniqueAreas = [...new Set(data.map((entry) => entry.area))];
    const uniqueAreaObj = {areas: uniqueAreas};
    const areaInLowercase = uniqueAreaObj.areas.map(
        (area:string) => area.toLowerCase());
    const resultJson: any = {};
    for (const entries of areaInLowercase) {
      console.log(entries);
      const response = await googleMaps.geocode({
        params: {
          address: entries,
          key: "AIzaSyCgK6O9xJIpjntal0ARJFm9noqxN4wHDXc",
        },
      });
      console.log(response.data.results[0].geometry.location);
      const {lat, lng} = response.data.results[0].geometry.location;
      const areaData = {
        area: entries,
        lat: lat,
        lng: lng,
      };
      resultJson[entries] = areaData;
    }
    res.status(200).json(resultJson);
  } catch (error) {
    console.error("Error reading Firestore collection: ", error);
    res.status(500).send("Error reading Firestore collection");
  }
});

export const SalaahTimesDailyCapeTown =
functions.https.onRequest(async (_req, res) => {
  salaahTimeRequests.getSalaahTimesDaily(getDate(), PredefinedLocations.CAPE_TOWN).
      then(async (response:SalaahTime) => {
        console.log("Success: ", response);
        const salaahTimes = response.data.timings;
        if (await realtimeDatabaseService.isPathPopulated("/CapeTown/Daily")) {
          realtimeDatabaseService.updateValue("/CapeTown/Daily", salaahTimes);
          res.status(200).send("Value updated in realtime database" + salaahTimes + getDate());
        } else {
          realtimeDatabaseService.setValue("/CapeTown/Daily", salaahTimes);
          res.status(200).send("Value added in realtime database" + salaahTimes);
        }
      })
      .catch((error) => {
        console.log("Fatal error: ", error as string);
        res.status(400).send(error as string);
      });
});

/**
 * Add JDoc
 * @return {Promise<admin.firestore.DocumentData[]>}
 */
// async function getJsonArray(): Promise<admin.firestore.DocumentData[]> {
//   try {
//     // Read the collection from Firestore
//     const collectionRef = admin.firestore().collection("masjid_cape_town");
//     const snapshot = await collectionRef.get();
//     const data = snapshot.docs.map((doc) => doc.data());
//     return data;
//   } catch (error) {
//     console.error("Error reading Firestore collection:", error);
//     throw error;
//   }
// }

// ****** TODO ******
// Use the function to read the collection
// Write a function that takes the JSON array and gets the area of each masjid.
// Confirm the area in the firestore database
// Get the geolocation data of each area
// Store that geolocation data of each area in a realtime database
// Write a function that takes the geolocation data of the user.
// Use this data to then determine which area the user is in.
// Write a function that will collect all the
// masjids in the users area from the JSON array
// Determine the order of the location.

export const getAddress = functions.https.onRequest(async (req, res) => {
  const placeName = req.query.place as string;

  try {
    // Use the Geocoding API to get the address of the place
    const response: GeocodeResponse = await googleMaps.geocode({
      params: {
        address: placeName,
        key: "AIzaSyCgK6O9xJIpjntal0ARJFm9noqxN4wHDXc",
      },
    });

    // Extract the formatted address from the response
    const address = response.data.results[0].formatted_address;

    res.send({address});
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred");
  }
});

interface SalaahTimingParams {
  date: string;
  latitude: number;
  longitude: number;
  method: number;
}
/**
 * AddJdoc
 * @param {SalaahTimingParams} params
 */
async function fetchSalaahTimings(params: SalaahTimingParams) {
  try {
    const {date, latitude, longitude, method} = params;
    const response = await axios.get(`http://api.aladhan.com/v1/timings/${date}`, {
      params: {
        latitude,
        longitude,
        method,
      },
    });
    const salaahTimings = response.data.data.timings;
    console.log(salaahTimings);
  } catch (error) {
    // Handle error
    console.error("Error fetching prayer timings:", error);
  }
}

function getDate(): string {
  const timezone = "GMT+2";
  const locale = "en-ZA";
  return moment().tz(timezone).locale(locale).format("DD-MM-YY");
}

export const getSalaahTiming = functions.https.onRequest(
    async (request, response) => {
      try {
        const params: SalaahTimingParams = {
          date: request.query.date as string,
          latitude: parseFloat(request.query.latitude as string),
          longitude: parseFloat(request.query.longitude as string),
          method: parseInt(request.query.method as string, 3),
        };

        const salaahTimings = await fetchSalaahTimings(params);

        response.json(salaahTimings);
      } catch (error) {
        console.error("Error fetching prayer timings:", error);
        response.status(500).send(
            "An error occurred while fetching prayer timings."
        );
      }
    });
