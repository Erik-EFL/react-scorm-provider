/**
 * @description This file contains the TypeScript interface for the SCORM context props.
 * @module scorm-context-props
 */
export interface IScormContextProps {
  /**
   * @description Indicates if the SCORM API is connected
   * @type {boolean}
   * @default false
   * @example true
   * @example false
  */
  apiConnected: boolean;
  /**
   * @description The name of the learner
   * @type {string}
   * @default "unknown"
   * @example "John Doe"
  */
  learnerName: string;
  /**
   * @description The completion status of the SCORM
   * @type {string}
   * @default "unknown"
   * @example "completed"
   * @example "incomplete"
  */
  completionStatus: string;
  /**
   * @description The suspend data of the SCORM
   * @type {Record<string, any>}
   * @default {}
   * @example { "key": "value" }
   */
  suspendData: Record<string, any>;
  /**
   * @description The version of the SCORM
   * @type {string}
   * @default "unknown"
   * @example "1.2"
   * @example "2004"
  */
  scormVersion: string;
  /**
   * @description Function to get the suspend data from the SCORM API
   * @example
   * const suspendData = await getSuspendData();
   * @returns {void}
  */
  getSuspendData: () => boolean;
  /**
   * @description Function to set the suspend data to the SCORM API
   * @example
   * setSuspendData({ key: "value" });
   * @returns {void}
  */
  setSuspendData: () => boolean;
  /**
   * @description Function to clear the suspend data from the SCORM API
   * @example
   * clearSuspendData();
   * @returns {void}
  */
  clearSuspendData: () => void;
  /**
   * @description Function to set the status of the SCORM API
   * @param {string} status - The status to set
   * @example
   * setStatus("completed");
   * @returns {void}
  */
  setStatus: (status: string) => void;
  /**
   * @description Function to set the score of the SCORM API
   * @param {Score} score - The score to set
   * @example
   * setScore({ value: 100, min: 0, max: 100, status: "passed" });
   * @returns {any}
  */
  setScore: (score: Score) => any;
  /**
   * @description Function to set a value in the SCORM API
   * @param {string} key - The key to set
   * @param {any} value - The value to set
   * @example
   * set("key", "value");
   * @returns {void}
  */
  set: (key: string, value: any) => void;
  /**
   * @description Function to get a value from the SCORM API
   * @param {string} key - The key to get
   * @example
   * const value = get("key");
   * @returns {any}
  */
  get: (key: string) => any;
  /**
   * @description Saves all current student progress to the LMS without ending the session (LMSCommit)
   * @example
   * commitData();
   * @returns {any}
   * @throws {Error} If the SCORM API is not connected
  */
  commitData: () => boolean;
}
