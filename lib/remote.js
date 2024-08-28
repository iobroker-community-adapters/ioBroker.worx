class remoteMower {
    constructor(config, adapter, axios) {
        this.config = config;
        this.adapter = adapter;
        this.resp = null;
        this.stop = false;
        this.isConnected = false;
        this.updateInterval = null;
        this.week = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        this.session = {
            url: "http://" + this.config.ip + ":80/jsondata.cgi",
            type: "GET",
            timeout: 5000,
            headers: { Authorization: "Basic " + Buffer.from("admin:" + this.config.pin).toString("base64") },
        };
        this.requestClient = axios.create({
            withCredentials: true,
        });
    }

    async start() {
        this.adapter.subscribeStates("mower.start");
        this.adapter.subscribeStates("mower.stop");
        this.createInfoObjects();
        this.secs = this.config.intervalMower;
        if (isNaN(this.secs) || this.secs < 1) {
            this.secs = 10;
        }
        this.resp = await this.requestClient(this.session)
            .then((response) => {
                if (response.data) {
                    this.adapter.log.info(JSON.stringify(response.data));
                    return response.data;
                } else {
                    this.adapter.log.error(`Error response!!`);
                    return false;
                }
            })
            .catch((error) => {
                this.adapter.log.error(error);
                return false;
            });
        this.resp = this.dummy1();
        if (this.resp) {
            this.isConnected = true;
            await this.adapter.setState("info.connection", { val: true, ack: true });
            if ("ore_movimento" in this.resp) {
                await this.procedewg796e();
            } else {
                await this.procedewg797e1();
            }
            await this.evaluateResponse();
            this.startInterval();
        } else {
            this.isConnected = false;
            this.adapter.log.info(`Connection invalid`);
            await this.adapter.setState("info.connection", { val: false, ack: true });
        }
    }

    startInterval() {
        if (this.stop) return;
        this.updateInterval && this.adapter.clearTimeout(this.updateInterval);
        this.updateInterval = this.adapter.setTimeout(async () => {
            this.checkStatus();
        }, this.secs * 1000);
    }

    async checkStatus() {
        this.adapter.log.info(JSON.stringify(this.session));
        this.resp = await this.requestClient(this.session)
            .then((response) => {
                if (response.data) {
                    this.adapter.log.debug(JSON.stringify(response.data));
                    return response.data;
                } else {
                    this.adapter.log.info(`Error response!!`);
                    return false;
                }
            })
            .catch((error) => {
                this.adapter.log.debug(error);
                return false;
            });
        this.resp = this.dummy1();
        if (this.resp) {
            if (!this.isConnected) {
                this.isConnected = true;
                await this.adapter.setState("info.connection", { val: true, ack: true });
            }
            await this.evaluateResponse();
            this.adapter.log.debug(`Connection valid`);
        } else {
            if (this.isConnected) {
                this.isConnected = false;
                await this.adapter.setState("info.connection", { val: false, ack: true });
            }
            this.adapter.log.debug(`Connection invalid`);
        }
        this.startInterval();
    }

    startMower() {
        this.adapter.log.info("Start Landroid");
        this.doPost('data=[["settaggi", 11, 1]]');
        this.adapter.setState("mower.start", { val: false, ack: true });
    }

    stopMower() {
        this.adapter.log.info("Stop Landroid");
        this.doPost('data=[["settaggi", 12, 1]]');
        this.adapter.setState("mower.stop", { val: false, ack: true });
    }

    async doPost(postData) {
        const options = {
            url: "http://" + this.config.ip + ":80/jsondata.cgi",
            method: "POST",
            data: postData,
            headers: {
                "Content-length": postData.length,
                "Content-type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                Authorization: "Basic " + Buffer.from("admin:" + this.config.pin).toString("base64"),
            },
        };
        this.requestClient(options)
            .then((response) => {
                if (response.data) {
                    this.adapter.log.debug(JSON.stringify(response.data));
                    this.resp = response.data;
                    this.evaluateResponse();
                } else {
                    this.adapter.log.info(`Error request`);
                }
            })
            .catch((error) => {
                this.adapter.log.error(`Error request - ${error}`);
            });
    }

    async evaluateResponse() {
        await this.adapter.setState("mower.lastsync", { val: new Date().toISOString(), ack: true });
        await this.adapter.setState("mower.firmware", { val: this.checkFirmware(), ack: true });
        this.evaluateCalendar(this.resp.ora_on, this.resp.min_on, this.resp.ore_funz);
        await this.adapter.setState("mower.waitRain", { val: this.resp.rit_pioggia, ack: true });
        await this.adapter.setState("mower.batteryState", { val: this.resp.perc_batt, ack: true });
        await this.adapter.setState("mower.areasUse", { val: this.resp.num_aree_lavoro, ack: true });
        await this.adapter.setState("mower.borderCut", { val: this.resp.enab_bordo === 1, ack: true });
        await this.adapter.setState("mower.status", {
            val: this.resp.state || this.getStatus(this.resp.settaggi, this.resp.allarmi),
            ack: true,
        });
        if ("ore_movimento" in this.resp) {
            await this.adapter.setState("mower.totalTime", { val: this.resp.ore_movimento * 0.1, ack: true });
        } else {
            await this.adapter.setState("mower.distance", { val: this.resp.distance, ack: true });
            await this.adapter.setState("mower.batteryChargerState", { val: this.resp.batteryChargerState, ack: true });
            await this.adapter.setState("mower.workReq", { val: this.resp.workReq, ack: true });
            await this.adapter.setState("mower.message", { val: this.resp.message, ack: true });
        }
    }

    getStatus(statusArr, alarmArr) {
        if (statusArr && alarmArr) {
            let alarm = false;
            for (let i = 0; i < alarmArr.length; i++) {
                if (alarmArr[i] === 1) {
                    alarm = true;
                    break;
                }
            }
            if (statusArr[14] === 1 && !alarm) {
                return "manual_stop";
            } else if (statusArr[5] === 1 && statusArr[13] === 0 && !alarm) {
                return "charging";
            } else if (statusArr[5] === 1 && statusArr[13] === 1 && !alarm) {
                return "charge_completed";
            } else if (statusArr[15] === 1 && !alarm) {
                return "going_home";
            } else if (alarmArr[0] === 1) {
                return "blade_blocked";
            } else if (alarmArr[1] === 1) {
                return "repositioning_error";
            } else if (alarmArr[2] === 1) {
                return "outside_wire";
            } else if (alarmArr[3] === 1) {
                return "blade_blocked";
            } else if (alarmArr[4] === 1) {
                return "outside_wire";
            } else if (alarmArr[10] === 1) {
                return "mower_tilted";
            } else if (alarmArr[5] === 1) {
                return "mower_lifted";
            } else if (alarmArr[6] === 1 || alarmArr[7] === 1 || alarmArr[8] === 1) {
                return "error";
            } else if (alarmArr[9] === 1) {
                return "collision_sensor_blocked";
            } else if (alarmArr[11] === 1) {
                return "charge_error";
            } else if (alarmArr[12] === 1) {
                return "battery_error";
            } else {
                return "mowing";
            }
        }
    }

    async evaluateCalendar(arrHour, arrMin, arrTime) {
        if (arrHour && arrMin && arrTime) {
            for (let i = 0; i < this.week.length; i++) {
                let starttime = arrHour[i] < 10 ? "0" + arrHour[i] : arrHour[i];
                starttime += ":";
                starttime += arrMin[i] < 10 ? "0" + arrMin[i] : arrMin[i];
                await this.adapter.setState("calendar." + this.week[i] + ".startTime", { val: starttime, ack: true });
                await this.adapter.setState("calendar." + this.week[i] + ".workTime", {
                    val: arrTime[i] * 0.1,
                    ack: true,
                });
            }
        }
    }

    checkFirmware() {
        if (this.resp.CntProg) {
            return "0." + this.resp.CntProg;
        }
        return this.resp.versione_fw;
    }

    async procedewg796e() {
        let common = {};
        common = {
            name: {
                en: "Total mower time",
                de: "Mähzeit insgesamt",
                ru: "Общее время",
                pt: "Tempo total do cortador",
                nl: "Totale maaitijd",
                fr: "Durée totale de la tondeuse",
                it: "Tempo totale di tosaerba",
                es: "Tiempo de frenado total",
                pl: "Całkowity czas kosiarki",
                uk: "Загальний час косарки",
                "zh-cn": "割草机总时间",
            },
            type: "number",
            role: "value",
            unit: "h",
            read: true,
            write: false,
            desc: "Total time the mower has been mowing in hours",
        };
        await this.adapter.createDataPoint(`mower.totalTime`, common, "state");
    }

    async procedewg797e1() {
        let common = {};
        common = {
            name: {
                en: "Total mower distance",
                de: "Gesamte Mähdistanz",
                ru: "Общее расстояние",
                pt: "Distância total do cortador",
                nl: "Totale maaiafstand",
                fr: "Distance totale de la tondeuse",
                it: "Distanza totale del tosaerba",
                es: "Distancia total de corta distancia",
                pl: "Całkowita odległość kosiarki",
                uk: "Загальна відстань косарки",
                "zh-cn": "割草机总距离",
            },
            type: "number",
            role: "value",
            unit: "m",
            read: true,
            write: false,
            desc: "Total distance the mower has been mowing in hours",
        };
        await this.adapter.createDataPoint(`mower.distance`, common, "state");
        common = {
            name: {
                en: "Battery charger state",
                de: "Batterieladezustand",
                ru: "Состояние заряда аккумулятора",
                pt: "Estado do carregador da bateria",
                nl: "Status batterijlader",
                fr: "État du chargeur de batterie",
                it: "Caricabatterie stato",
                es: "Estado cargador de batería",
                pl: "Stan ładowania akumulatora",
                uk: "Стан зарядного пристрою акумулятора",
                "zh-cn": "电池充电器状态",
            },
            type: "string",
            role: "value",
            read: true,
            write: false,
            desc: "Battery charger state",
        };
        await this.adapter.createDataPoint(`mower.batteryChargerState`, common, "state");
        common = {
            name: {
                en: "Work request",
                de: "Arbeitsanfrage",
                ru: "Запрос на работу",
                pt: "Pedido de trabalho",
                nl: "Werkverzoek",
                fr: "Demande de travail",
                it: "Richiesta di lavoro",
                es: "Solicitud de trabajo",
                pl: "Wniosek o pracę",
                uk: "Вимоги до роботи",
                "zh-cn": "工作要求",
            },
            type: "string",
            role: "value",
            read: true,
            write: false,
            desc: "Last request from user",
        };
        await this.adapter.createDataPoint(`mower.workReq`, common, "state");
        common = {
            name: {
                en: "Message",
                de: "Nachricht",
                ru: "Сообщение",
                pt: "Mensagem",
                nl: "Bericht",
                fr: "Message",
                it: "Messaggio",
                es: "Mensaje",
                pl: "Wiadomość",
                uk: "Новини",
                "zh-cn": "消息",
            },
            type: "string",
            role: "value",
            read: true,
            write: false,
            desc: "Landroid message",
        };
        await this.adapter.createDataPoint(`mower.message`, common, "state");
    }

    async createInfoObjects() {
        let common = {};
        common = {
            name: {
                en: "Mower status and control",
                de: "Mähstatus und Kontrolle",
                ru: "Статус и контроль",
                pt: "Status e controle do cortador",
                nl: "Machtstatus en controle",
                fr: "Statut et contrôle de la tondeuse",
                it: "Stato e controllo della tosaerba",
                es: "Estado y control de la masa",
                pl: "Statystyka i kontrola",
                uk: "Статус на сервери",
                "zh-cn": "评 注地位和控制",
            },
        };
        await this.adapter.createDataPoint(`mower`, common, "channel");
        common = {
            name: {
                en: "Last successful sync",
                de: "Letzte erfolgreiche Sync",
                ru: "Последняя успешная синхронизация",
                pt: "Última sincronização bem sucedida",
                nl: "Laatste succesvolle synchronisatie",
                fr: "Dernière synchronisation réussie",
                it: "Ultimo messaggio di successo",
                es: "Última sincronización exitosa",
                pl: "Ostatnia skuteczna synchronizacja",
                uk: "Остання успішна синхронізація",
                "zh-cn": "上次成功同步",
            },
            type: "string",
            role: "date",
            read: true,
            write: false,
            def: 0,
            desc: "Last successful sync",
        };
        await this.adapter.createDataPoint(`mower.lastsync`, common, "state");
        common = {
            name: {
                en: "Firmware Version",
                de: "Firmware Version",
                ru: "Версия прошивки",
                pt: "Versão de firmware",
                nl: "Firmware Version",
                fr: "Firmware Version",
                it: "Versione firmware",
                es: "Versión de firmware",
                pl: "Strona oficjalna",
                uk: "Версія прошивки",
                "zh-cn": "Frmware Version",
            },
            type: "number",
            role: "info.firmware",
            read: true,
            write: false,
            desc: "Firmware Version",
        };
        await this.adapter.createDataPoint(`mower.firmware`, common, "state");
        common = {
            name: {
                en: "Start Landroid",
                de: "Landroid starten",
                ru: "Старт Ландроид",
                pt: "Começar Landroid",
                nl: "Landroid starten",
                fr: "Démarrer Landroid",
                it: "Avviare Landroid",
                es: "Start Landroid",
                pl: "Uruchom Landroid",
                uk: "Старт Landroid",
                "zh-cn": "启动 Landroid",
            },
            type: "boolean",
            role: "button",
            read: true,
            write: true,
            def: false,
            desc: "Start Landroid",
        };
        await this.adapter.createDataPoint(`mower.start`, common, "state");
        common = {
            name: {
                en: "Stop Landroid",
                de: "Auf der Karte",
                ru: "Stop Landroid",
                pt: "Pára com o Landroid",
                nl: "Landroid stoppen",
                fr: "Arrêter Landroid",
                it: "Stop Landroid",
                es: "Stop Landroid",
                pl: "Zatrzymaj Landroida",
                uk: "Зупинка Landroid",
                "zh-cn": "停止陆路机器人",
            },
            type: "boolean",
            role: "button",
            read: true,
            write: true,
            def: false,
            desc: "Stop Landroid",
        };
        await this.adapter.createDataPoint(`mower.stop`, common, "state");
        common = {
            name: {
                en: "Edge cut",
                de: "Kantenschnitt",
                ru: "Край отрезок",
                pt: "Corte de borda",
                nl: "Edge sneed",
                fr: "Coupe de bord",
                it: "Tagliato",
                es: "Corto de borde",
                pl: "Edge cut",
                uk: "Краватка",
                "zh-cn": "削减。",
            },
            type: "boolean",
            role: "switch",
            read: true,
            write: false,
            desc: "The mower cut border today",
        };
        await this.adapter.createDataPoint(`mower.borderCut`, common, "state");
        common = {
            name: {
                en: "Status mower",
                de: "Status Mäher",
                ru: "Статус mower",
                pt: "Cortador de status",
                nl: "Status Mower",
                fr: "Mower",
                it: "Stato tosaerba",
                es: "Alcantarillado de estado",
                pl: "Status mower",
                uk: "Статус на сервери",
                "zh-cn": "现状",
            },
            type: "string",
            role: "info",
            read: true,
            write: false,
            desc: "Current status of lawn mower",
        };
        await this.adapter.createDataPoint(`mower.status`, common, "state");
        common = {
            name: {
                en: "Landroid battery state",
                de: "Landroid Batterie Zustand",
                ru: "Landroid состояние батареи",
                pt: "Estado da bateria de Landroid",
                nl: "Landroid batterij staat",
                fr: "État de la batterie Landroid",
                it: "Stato della batteria Landroid",
                es: "Estado de la batería de Landroid",
                pl: "Bateria Landroid",
                uk: "Стан акумулятора Landroid",
                "zh-cn": "内陆电池国",
            },
            type: "number",
            role: "value.battery",
            read: true,
            write: false,
            unit: "%",
            desc: "Landroid mower battery state in %",
        };
        await this.adapter.createDataPoint(`mower.batteryState`, common, "state");
        common = {
            name: {
                en: "Wait time after rain",
                de: "Wartezeit nach Regen",
                ru: "Время ожидания после дождя",
                pt: "Tempo de espera após a chuva",
                nl: "Wacht even na regen",
                fr: "Temps d'attente après la pluie",
                it: "Tempo di attesa dopo la pioggia",
                es: "Espera tiempo después de la lluvia",
                pl: "Czas po deszczu",
                uk: "Час очікування після дощу",
                "zh-cn": "雨季之后的时间",
            },
            type: "number",
            role: "value.interval",
            read: true,
            write: false,
            unit: "min",
            def: 0,
            desc: "Time to wait after rain, in minutes",
        };
        await this.adapter.createDataPoint(`mower.waitRain`, common, "state");
        common = {
            name: {
                en: "Number of areas",
                de: "Anzahl der Bereiche",
                ru: "Число районов",
                pt: "Número de áreas",
                nl: "Aantal gebieden",
                fr: "Nombre de zones",
                it: "Numero di aree",
                es: "Número de zonas",
                pl: "Liczba obszarów",
                uk: "Кількість ділянок",
                "zh-cn": "领域数",
            },
            type: "number",
            role: "value",
            read: true,
            write: false,
            desc: "Number of areas in use",
        };
        await this.adapter.createDataPoint(`mower.areasUse`, common, "state");
        common = {
            name: {
                en: "Mower calendar",
                de: "Mower Kalender",
                ru: "Календарь Mower",
                pt: "Calendário do cortador",
                nl: "Mower kalender",
                fr: "Calendrier des opérations",
                it: "Calendario dei rifiuti",
                es: "Calendario de caducidad",
                pl: "Kalendarz Mowera",
                uk: "Календар подій",
                "zh-cn": "评 注",
            },
        };
        await this.adapter.createDataPoint(`calendar`, common, "channel");
        for (const day of this.week) {
            common = {
                name: day,
            };
            await this.adapter.createDataPoint(`calendar.${day}`, common, "channel");
            common = {
                name: {
                    en: "Start time",
                    de: "Startzeit",
                    ru: "Время начала",
                    pt: "Tempo de início",
                    nl: "Begintijd",
                    fr: "Heure de début",
                    it: "Inizio",
                    es: "Hora de inicio",
                    pl: "Czas rozpoczęcia",
                    uk: "Час початку",
                    "zh-cn": "开始时间",
                },
                type: "string",
                role: "state",
                read: true,
                write: false,
                desc: `Hour:Minutes on the day (${day}) that the Landroid should start mowing`,
            };
            await this.adapter.createDataPoint(`calendar.${day}.startTime`, common, "state");
            common = {
                name: {
                    en: "Work time",
                    de: "Arbeitszeit",
                    ru: "Время работы",
                    pt: "Tempo de trabalho",
                    nl: "Werktijd",
                    fr: "Temps de travail",
                    it: "Tempo di lavoro",
                    es: "Tiempo de trabajo",
                    pl: "Czas pracy",
                    uk: "Час роботи",
                    "zh-cn": "工作时间",
                },
                type: "number",
                role: "value",
                unit: "h",
                read: true,
                write: false,
                desc: "Decides for how long the mower will work each day",
            };
            await this.adapter.createDataPoint(`calendar.${day}.workTime`, common, "state");
        }
    }

    destroy() {
        this.stop = true;
        this.updateInterval && this.adapter.clearTimeout(this.updateInterval);
        this.adapter.setState("info.connection", { val: false, ack: true });
    }

    dummy1() {
        return {
            versione_fw: 1.97,
            lingua: 0,
            ore_funz: [180, 180, 180, 180, 180, 180, 180],
            ora_on: [9, 9, 9, 9, 9, 9, 9],
            min_on: [0, 0, 0, 0, 0, 0, 0],
            allarmi: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            settaggi: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            mac: [11, 11, 11, 11, 11, 11],
            time_format: 1,
            date_format: 2,
            rit_pioggia: 180,
            area: 0,
            enab_bordo: 1,
            percent_programmatore: 0,
            indice_area: 9,
            tempo_frenatura: 20,
            perc_rallenta_max: 70,
            canale: 0,
            num_ricariche_batt: 0,
            num_aree_lavoro: 1,
            dist_area: [1, 1, 1, 1],
            perc_per_area: [1, 1, 1, 1],
            area_in_lavoro: 0,
            email: "iobroker@lmdsoft.de",
            perc_batt: 79,
            ver_proto: 1,
            state: "grass cutting",
            workReq: "user req grass cut",
            message: "none",
            batteryChargerState: "idle",
            distance: 90725,
        };
    }

    dummy2() {
        return {
            CntProg: 81,
            lingua: 1,
            ore_funz: [30, 30, 30, 30, 30, 30, 30],
            ora_on: [20, 20, 20, 20, 20, 20, 20],
            min_on: [0, 0, 0, 0, 0, 0, 0],
            allarmi: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            settaggi: [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            mac: [11, 11, 11, 11, 11, 11],
            time_format: 1,
            date_format: 1,
            rit_pioggia: 120,
            area: 0,
            enab_bordo: 0,
            g_sett_attuale: 4,
            g_ultimo_bordo: 0,
            ore_movimento: 2309,
            percent_programmatore: 0,
            indice_area: 1,
            tipo_lando: 8,
            beep_hi_low: 0,
            gradi_ini_diritto: 30,
            perc_cor_diritto: 103,
            coef_angolo_retta: 80,
            scost_zero_retta: 1,
            offset_inclinometri: [2019, 2024, 2706],
            gr_rall_inizio: 80,
            gr_rall_finale: 300,
            gr_ini_frenatura: 130,
            perc_vel_ini_frenatura: 50,
            tempo_frenatura: 20,
            perc_rallenta_max: 50,
            canale: 0,
            num_ricariche_batt: 4,
            num_aree_lavoro: 1,
            Dist_area: [1, 1, 1, 1],
            perc_per_area: [1, 1, 1, 1],
            area_in_lavoro: 0,
            email: "iobroker@lmdsoft.de",
            perc_batt: 88,
        };
    }
}

module.exports = remoteMower;
