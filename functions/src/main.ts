import * as functions from "firebase-functions";
import axios from "axios";
import {SalaahTimesDaily} from "./models/SalaahTimesByCity";
// import {SalaahTimeCalendarByCity} from "./models/SalaahTimeCalendarByCity";
// import {Response} from "./models/Response";

// type Time = {
//   time: string;
// }

// type getTimeResponse = {
//   data: Time[];
// }

/**
 * Initiates a api request
 * @param {string} country The selected country
 * @param {string} city The selected city
 * @return {any} Returns data or error
 */
async function getSalaahTimes(country: string, city: string) {
  try {
    const {data, status} = await axios.get<SalaahTimesDaily>(
        "http://api.aladhan.com/v1/timingsByCity", {
          params: {
            country: country,
            city: city,
            method: "8",
          },
        },
    );
    console.log("response status is:", status);

    return data.data.timings;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log("Error message: ", error.message);
      return error.message;
    } else {
      console.log("unexpected error: ", error);
      return "Unexpected error";
    }
  }
}

// /**
//  * Initiates a api request
//  * @param {string} country The selected country
//  * @param {string} city The selected city
//  * @return {any} Returns data or error
//  */
// async function getSalaahTimesCalendar(country: string, city: string) {
//   try {
//     const {data, status} = await axios.get<SalaahTimeCalendarByCity>(
//         "http://api.aladhan.com/v1/calendarByCity", {
//           params: {
//             country: country,
//             city: city,
//             method: "8",
//           },
//         },
//     );
//     console.log("response status is:", status);

//     return data.data;
//   } catch (error) {
//     if (axios.isAxiosError(error)) {
//       console.log("Error message: ", error.message);
//       return error.message;
//     } else {
//       console.log("unexpected error: ", error);
//       return "Unexpected error";
//     }
//   }
// }

// /**
//  * Initiates a api request
//  * @param {string} country The selected country
//  * @param {string} city The selected city
//  * @return {any} Returns data or error
//  */
// async function getCurrentTime(country: string, city: string) {
//   try {
//     const {data, status} = await axios.get<getTimeResponse>(
//         "http://api.aladhan.com/v1/currentTime", {
//           params: {
//             zone: `${country}/${city}`,
//           },
//         },
//     );
//     console.log("response status is:", status);

//     return data.data;
//   } catch (error) {
//     if (axios.isAxiosError(error)) {
//       console.log("Error message: ", error.message);
//       return error.message;
//     } else {
//       console.log("unexpected error: ", error);
//       return "Unexpected error";
//     }
//   }
// }

export const callSalaahTimeDailyonCall = functions.https.onCall(async (
    data, context
) => {
  const country = data.country;
  const city = data.city;
  return (await getSalaahTimes(country, city));
});

export const callSalaahTimeDaily = functions.https.onRequest(async (
    request, response
) => {
  const country = request.body.country;
  const city = request.body.city;
  response.send(await getSalaahTimes(country, city));
});
