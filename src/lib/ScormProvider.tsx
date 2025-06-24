import React, { createContext, useEffect, useState, useCallback, ReactNode } from "react";
import { SCORM, debug } from "pipwerks-scorm-api-wrapper";
import { Score } from ".";
import { IScormContextProps } from "@/@types/scorm-context-props";

export const ScoContext = createContext<IScormContextProps | undefined>(undefined);

interface ScormProviderProps {
  children: ReactNode;
  version?: "1.2" | "2004";
  debug?: boolean;
}

const formatSessionTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.00`;
};

const ScormProvider: React.FC<ScormProviderProps> = ({ children, version, debug: isDebug }) => {
  const [apiConnected, setApiConnected] = useState(false);
  const [learnerName, setLearnerName] = useState("unknown");
  const [completionStatus, setCompletionStatus] = useState("unknown");
  const [suspendData, setSuspendDataState] = useState<Record<string, any>>({});
  const [scormVersion, setScormVersion] = useState<string>("");

  useEffect(() => {
    createScormAPIConnection();
    window.addEventListener("beforeunload", closeScormAPIConnection);
    return () => {
      closeScormAPIConnection();
      window.removeEventListener("beforeunload", closeScormAPIConnection);
    };
  }, []);

  const createScormAPIConnection = useCallback(() => {
    if (apiConnected) return;

    if (version) SCORM.version = version;
    if (typeof isDebug === "boolean") debug.isActive = isDebug;

    if (SCORM.init()) {
      const version = SCORM.version;
      const learner = version === "1.2" ? SCORM.get("cmi.core.student_name") : SCORM.get("cmi.learner_name");
      const status = SCORM.status("get");

      setApiConnected(true);
      setLearnerName(learner || "unknown");
      setCompletionStatus(status || "unknown");
      setScormVersion(version);
      getSuspendData();
    } else {
      console.error("ScormProvider init error: could not create the SCORM API connection");
    }
  }, [apiConnected, version, isDebug]);

  const closeScormAPIConnection = useCallback(() => {
    if (!apiConnected) return;

    setSuspendData();
    SCORM.status("set", completionStatus);
    SCORM.save();

    if (SCORM.quit()) {
      setApiConnected(false);
      setLearnerName("unknown");
      setCompletionStatus("unknown");
      setSuspendDataState({});
      setScormVersion("");
    } else {
      console.error("ScormProvider error: could not close the API connection");
    }
  }, [apiConnected, completionStatus]);

  /**
  * @description Saves all current student progress to the LMS without ending the session (LMSCommit)
  * @example
  * commitData();
  * @returns {boolean} Returns true if the commit was successful, false otherwise
  * @throws {Error} If the SCORM API is not connected
  */
  const commitData = useCallback((): boolean => {
    if (!apiConnected) {
      throw new Error("SCORM API não conectada");
    }

    try {
      // 1. Garantir que dados críticos estejam definidos
      const exitMode = SCORM.get("cmi.core.exit");
      if (!exitMode || exitMode !== "suspend") {
        SCORM.set("cmi.core.exit", "suspend");
      }

      // 2. Tentar commit usando diferentes métodos
      let success = false;

      // Método 1: Função direta do provedor
      if (typeof SCORM.save === "function") {
        success = SCORM.save() !== "false";
      }

      // Método 2: LMSCommit direto (mais confiável em alguns LMS)
      if (!success && SCORM.version === "1.2") {
        try {
          // @ts-ignore - Acesso direto à API SCORM
          success = SCORM.API.LMSCommit("") !== "false";
        } catch (e) {
          console.warn("Erro ao tentar LMSCommit direto:", e);
        }
      }

      // 3. Verificar se o commit funcionou
      const suspendData = SCORM.get("cmi.suspend_data");
      if (!suspendData || suspendData === "{}") {
        console.warn("Commit não persistiu dados em suspend_data");
      }

      return success;
    } catch (error) {
      console.error("Erro no commit:", error);
      return false;
    }
  }, [apiConnected]);

  const getSuspendData = useCallback(() => {
    if (!apiConnected) {
      throw new Error("SCORM API não conectada");
    }

    try {
      const data = SCORM.get("cmi.suspend_data");
      let parsedData = {};

      if (data && data !== "{}") {
        try {
          parsedData = JSON.parse(data);
          console.log("Dados recuperados de suspend_data com sucesso");
        } catch (e) {
          console.warn("Erro ao processar dados de suspend_data:", e);
        }
      } else {
        console.warn("Nenhum dado encontrado em suspend_data");

        const locationData = SCORM.get("cmi.core.lesson_location");
        if (locationData && locationData.includes("activityId=")) {
          console.log("Encontrado identificador em lesson_location:", locationData);
        }
      }

      const status = SCORM.get("cmi.core.lesson_status");
      if (status === "completed" || status === "passed") {
        console.log("Atividade já marcada como concluída no LMS");

        const score = SCORM.get("cmi.core.score.raw");
        if (score) {
          console.log("Pontuação recuperada:", score);
        }
      }

      setSuspendDataState(parsedData);
      return true;
    } catch (error) {
      console.error("Erro ao carregar suspend_data:", error);
      return false;
    }
  }, [apiConnected]);

  const setSuspendData = useCallback(() => {
    if (!apiConnected) {
      console.warn("SCORM API não conectada, impossível salvar dados");
      return false;
    }

    try {
      SCORM.set("cmi.suspend_data", JSON.stringify(suspendData));

      const locationData = `activityId=${Object.keys(suspendData).join(',')}&ts=${Date.now()}`;
      SCORM.set("cmi.core.lesson_location", locationData);

      SCORM.set("cmi.core.exit", "suspend");

      const sessionTime = formatSessionTime(30 * 60 * 1000);
      SCORM.set("cmi.core.session_time", sessionTime);

      const status = SCORM.get("cmi.core.lesson_status");
      if (status !== "completed" && status !== "passed") {
        SCORM.set("cmi.core.lesson_status", "incomplete");
      }

      const commitSuccess = commitData();

      const savedData = SCORM.get("cmi.suspend_data");
      if (!savedData || savedData === "{}") {
        console.warn("Dados não foram persistidos corretamente no suspend_data");
        return false;
      }

      return commitSuccess;
    } catch (error) {
      console.error("Erro ao salvar suspend_data:", error);
      return false;
    }
  }, [apiConnected, suspendData, commitData]);

  const clearSuspendData = useCallback(() => setSuspendDataState({}), []);

  const setStatus = useCallback((status: string) => {
    if (!apiConnected) return;
    setCompletionStatus(status);
    SCORM.status("set", status);
  }, [apiConnected]);

  const setScore = useCallback((score: Score): any => {
    if (!apiConnected) {
      return new Error("SCORM API not connected");
    }

    try {
      SCORM.set("cmi.score.raw", score.value);

      if (scormVersion === "2004") {
        SCORM.set("cmi.score.min", score.min);
        SCORM.set("cmi.score.max", score.max);
      } else if (scormVersion === "1.2") {
        SCORM.set("cmi.core.score.min", score.min);
        SCORM.set("cmi.core.score.max", score.max);
      }

      if (score.status && score.status !== "0") {
        setStatus(score.status);
      }

      const saveResult = SCORM.save();

      return saveResult;
    } catch (error) {
      return error instanceof Error;
    }
  }, [apiConnected, scormVersion, setStatus]);

  const set = useCallback((key: string, value: any) => {
    if (!apiConnected) return;
    SCORM.set(key, value);
  }, [apiConnected]);

  const get = useCallback((key: string) => {
    if (!apiConnected) return null;
    return SCORM.get(key);
  }, [apiConnected]);

  return (
    <ScoContext.Provider
      value={{
        apiConnected,
        learnerName,
        completionStatus,
        suspendData,
        scormVersion,
        getSuspendData,
				setSuspendData,
        clearSuspendData,
        setStatus,
        setScore,
        set,
        get,
        commitData,
      }}
    >
      {children}
    </ScoContext.Provider>
  );
};

export const useScorm = (): IScormContextProps => {
  const context = React.useContext(ScoContext);
  if (!context) {
    throw new Error("useScorm must be used within a ScormProvider");
  }
  return context;
};

export default ScormProvider;
