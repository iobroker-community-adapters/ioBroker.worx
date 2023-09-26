const objects = require(`./objects`);
module.exports = {
    async createActivity(mower) {
        let common = {};
        common = {
            name: {
                en: "Mower activity logs",
                de: "Mäher Aktivitätsprotokolle",
                ru: "Переключение логов активности",
                pt: "Registos de atividade do cortador",
                nl: "Meerdere activiteiten",
                fr: "Les registres d'activité de la tondeuse",
                it: "Tronchi di attività del tosaerba",
                es: "Registros de actividad de alcantarillado",
                pl: "Mower activity logs",
                uk: "Моверизаторні колодки",
                "zh-cn": "反应活动逻辑。",
            },
        };
        await this.createDataPoint(`${mower.serial_number}.activityLog`, common, "channel");
        common = {
            name: {
                en: "Activity log as array.",
                de: "Aktivitätsprotokoll als Array.",
                ru: "Журнал активности как массив.",
                pt: "Registo de atividade como array.",
                nl: "Activiteitslog als array.",
                fr: "Journal d'activité comme tableau.",
                it: "Diario di attività come array.",
                es: "Registro de actividad como array.",
                pl: "Logika aktywna jako tablica.",
                uk: "Журнал активності в масиві.",
                "zh-cn": "2. 活动逻辑作为范围。.",
            },
            type: "string",
            role: "json",
            read: true,
            write: false,
            desc: "Activity Logs",
        };
        await this.createDataPoint(`${mower.serial_number}.activityLog.payload`, common, "state");
        common = {
            name: {
                en: "Update Activity logs",
                de: "Aktualisieren von Aktivitätsprotokollen",
                ru: "Обновление Журналов Активности",
                pt: "Atualizar registros de atividades",
                nl: "Update Activity logboeken",
                fr: "Mise à jour des registres des activités",
                it: "Log di attività di aggiornamento",
                es: "Registros de actividad de actualización",
                pl: "Logika aktualności",
                uk: "Оновлення журналів активності",
                "zh-cn": "最新活动逻辑",
            },
            type: "boolean",
            role: "button",
            read: true,
            write: true,
            def: false,
            desc: "Manuell Update Activity Logs",
        };
        await this.createDataPoint(`${mower.serial_number}.activityLog.manuell_update`, common, "state");
        common = {
            name: {
                en: "Last update from Activity logs",
                de: "Letzte Aktualisierung von Aktivitätsprotokollen",
                ru: "Последнее обновление от Activity logs",
                pt: "Última atualização de registros de atividades",
                nl: "Laatste update van Activity logboeken",
                fr: "Dernière mise à jour des registres d'activité",
                it: "Ultimo aggiornamento dai registri delle attività",
                es: "Última actualización de los registros de actividad",
                pl: "Ostatnia aktualizacja z logiki Activity",
                uk: "Останнє оновлення з журналів активності",
                "zh-cn": "活动逻辑的最后更新",
            },
            type: "number",
            role: "date",
            read: true,
            write: false,
            def: 0,
            desc: "Last Update Activity-Log",
        };
        await this.createDataPoint(`${mower.serial_number}.activityLog.last_update`, common, "state");
    },
    async createMqttData() {
        let common = {};
        await this.setObjectNotExistsAsync(`info_mqtt`, {
            type: "channel",
            common: {
                name: {
                    en: "Info Mqtt connection",
                    de: "Info Mqtt Verbindung",
                    ru: "Инфо Mqtt соединение",
                    pt: "Conexão do Info Mqtt",
                    nl: "Info Mqt",
                    fr: "Info Connexion Mqt",
                    it: "Informazioni Collegamento Mqtt",
                    es: "Info Conexión Mqtt",
                    pl: "Info Mqtt",
                    uk: "Info Mqtt підключення",
                    "zh-cn": "Info Mqt的联系",
                },
                statusStates: {
                    onlineId: `${this.namespace}.info_mqtt.online`,
                },
            },
            native: {},
        });
        common = {
            type: "boolean",
            role: "state",
            name: {
                en: "MQTT state",
                de: "MQTT-Zustand",
                ru: "MQTT государство",
                pt: "Estado MQTT",
                nl: "MQT staat",
                fr: "État du MQTT",
                it: "Stato MQTT",
                es: "Estado MQTT",
                pl: "Stan MQTT",
                uk: "Стан МКТТ",
                "zh-cn": "MQTT国",
            },
            desc: "Mqtt state",
            read: true,
            write: false,
            def: false,
        };
        await this.createDataPoint(`info_mqtt.online`, common, "state");
        common = {
            type: "number",
            role: "date.start",
            name: {
                en: "Last update",
                de: "Letzte Aktualisierung",
                ru: "Последнее обновление",
                pt: "Última atualização",
                nl: "Laatste update",
                fr: "Dernière mise à jour",
                it: "Ultimo aggiornamento",
                es: "Última actualización",
                pl: "Aktualizacja",
                uk: "Останнє оновлення",
                "zh-cn": "上次更新",
            },
            desc: "Last update",
            read: true,
            write: false,
            def: 0,
        };
        await this.createDataPoint(`info_mqtt.last_update`, common, "state");
        common = {
            type: "number",
            role: "date.end",
            name: {
                en: "Next update.",
                de: "Nächstes Update.",
                ru: "Следующее обновление.",
                pt: "Próxima actualização.",
                nl: "Volgende update.",
                fr: "Prochaine mise à jour.",
                it: "Prossimo aggiornamento.",
                es: "Siguiente actualización.",
                pl: "Kolejna aktualizacja.",
                uk: "Далі оновлення.",
                "zh-cn": "下一次更新。.",
            },
            desc: "Next update (Refresh-Token)",
            read: true,
            write: false,
            def: 0,
        };
        await this.createDataPoint(`info_mqtt.next_update`, common, "state");
        common = {
            type: "number",
            role: "value",
            name: {
                en: "Incomplete operation count",
                de: "Unvollständige Betriebszählung",
                ru: "Неполный счет операции",
                pt: "Contagem de operação incompleta",
                nl: "Onvolledige operatie telt",
                fr: "Compte d ' opérations incomplètes",
                it: "Conto di funzionamento incompleto",
                es: "Cuenta de operación incompleta",
                pl: "Niepełna operacja",
                uk: "Кількість неповних операцій",
                "zh-cn": "行动不完善",
            },
            desc: "Total number of operations submitted to the connection that have not yet been completed. Unacked operations are a subset of this.",
            read: true,
            write: false,
            def: 0,
        };
        await this.createDataPoint(`info_mqtt.incompleteOperationCount`, common, "state");
        common = {
            type: "number",
            role: "value",
            name: {
                en: "Incomplete operation size",
                de: "Unvollständige Betriebsgröße",
                ru: "Неполный размер операции",
                pt: "Tamanho da operação incompleta",
                nl: "Incomplete operationele maat",
                fr: "Taille de fonctionnement incomplète",
                it: "Dimensione del funzionamento incompleto",
                es: "Tamaño de operación incompleta",
                pl: "Operacja niekompletna",
                uk: "Неповторний розмір операції",
                "zh-cn": "行动规模不完善",
            },
            desc: "Total packet size of operations submitted to the connection that have not yet been completed. Unacked operations are a subset of this.",
            read: true,
            write: false,
            def: 0,
        };
        await this.createDataPoint(`info_mqtt.incompleteOperationSize`, common, "state");
        common = {
            type: "number",
            role: "value",
            name: {
                en: "Unacked operation count",
                de: "Unacked Operation Count",
                ru: "Незапрашиваемый счет операции",
                pt: "Contagem de operação inacabada",
                nl: "Onaangeroerde operatie tel",
                fr: "Compte d ' opérations non blindées",
                it: "Conto di funzionamento non hackerato",
                es: "Conteo de operaciones sin cargo",
                pl: "Nieuszkocka operacja",
                uk: "Непристойна кількість операцій",
                "zh-cn": "未清偿业务计值",
            },
            desc: "Total number of operations that have been sent to the server and are waiting for a corresponding ACK before they can be completed.",
            read: true,
            write: false,
            def: 0,
        };
        await this.createDataPoint(`info_mqtt.unackedOperationCount`, common, "state");
        common = {
            type: "number",
            role: "value",
            name: {
                en: "Unacked operation size",
                de: "Ungebundene Betriebsgröße",
                ru: "Незаметный размер операции",
                pt: "Tamanho de operação não embalado",
                nl: "Onaangevallen operatie groot",
                fr: "Taille de l'opération intacte",
                it: "Dimensione dell'operazione",
                es: "Tamaño de operación no reducido",
                pl: "Przeciętna operacja",
                uk: "Незареєстрований розмір операції",
                "zh-cn": "未清业务规模",
            },
            desc: "Total packet size of operations that have been sent to the server and are waiting for a corresponding ACK before they can be completed.",
            read: true,
            write: false,
            def: 0,
        };
        await this.createDataPoint(`info_mqtt.unackedOperationSize`, common, "state");
    },
    async createDevices(mower) {
        let common = {};
        let states_cmd = {};
        let week_count = 0;
        common = {
            name: mower.name,
        };
        await this.createDataPoint(mower.serial_number, common, "device");
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
        await this.createDataPoint(`${mower.serial_number}.calendar`, common, "channel");
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
        await this.createDataPoint(`${mower.serial_number}.mower`, common, "channel");
        common = {
            name: {
                en: "Mower Areas",
                de: "Mähergebiete",
                ru: "Районы Mower",
                pt: "Áreas de esgoto",
                nl: "Mower Areas",
                fr: "Zones d ' amorçage",
                it: "Zone fognarie",
                es: "Mower Areas",
                pl: "Obszar Mowera",
                uk: "Моверарки",
                "zh-cn": "摩托区",
            },
        };
        await this.createDataPoint(`${mower.serial_number}.areas`, common, "channel");
        if (mower.capabilities != null && mower.capabilities.includes("vision")) {
            //calendar second schedule
            for (const day of this.week) {
                common = {
                    name: objects.weekname2[week_count],
                };
                ++week_count;
                await this.createDataPoint(`${mower.serial_number}.calendar.${day}2`, common, "channel");
                for (const o of objects.calendar) {
                    await this.createDataPoint(
                        `${mower.serial_number}.calendar.${day}2.${o._id}`,
                        o.common,
                        o.type,
                        o.native,
                    );
                }
            }
            states_cmd = {
                1: "Start",
                2: "Stop",
                3: "Home",
                5: "Lock",
                6: "Unlock",
            };
            common = {
                name: {
                    en: "RFID",
                    de: "RFID",
                    ru: "RFID",
                    pt: "RFID",
                    nl: "RFID",
                    fr: "RFID",
                    it: "RFID",
                    es: "RFID",
                    pl: "RFID",
                    uk: "RFID КАРТИ",
                    "zh-cn": "导 言",
                },
                type: "number",
                role: "indicator",
                read: true,
                write: false,
                desc: `Mowing zone detection`,
            };
            await this.createDataPoint(`${mower.serial_number}.areas.rfid`, common, "state");
            common = {
                name: {
                    en: "Information for product improvement",
                    de: "Informationen zur Produktverbesserung",
                    ru: "Информация для улучшения продукта",
                    pt: "InformaÃ§Ã£o para a melhoria do produto",
                    nl: "Informatie voor productverbetering",
                    fr: "Information pour l'amélioration des produits",
                    it: "Informazioni per il miglioramento dei prodotti",
                    es: "Información para la mejora del producto",
                    pl: "Informacja o poprawie produktu",
                    uk: "Інформація для вдосконалення продукту",
                    "zh-cn": "改进产品信息",
                },
                type: "boolean",
                role: "switch",
                read: true,
                write: true,
                desc: "Information for product improvement",
            };
            await this.createDataPoint(`${mower.serial_number}.mower.log_improvement`, common, "state");
            common = {
                name: {
                    en: "Information for troubleshooting",
                    de: "Informationen zur Fehlerbehebung",
                    ru: "Информация для устранения неполадок",
                    pt: "InformaÃ§Ã£o para solução de problemas",
                    nl: "Informatie voor problemen",
                    fr: "Information pour le dépannage",
                    it: "Informazioni per la risoluzione dei problemi",
                    es: "Información para la solución de problemas",
                    pl: "Informacja o problemach",
                    uk: "Інформація для усунення несправностей",
                    "zh-cn": "关于麻烦的信息",
                },
                type: "boolean",
                role: "switch",
                read: true,
                write: true,
                desc: "Information for troubleshooting",
            };
            await this.createDataPoint(`${mower.serial_number}.mower.log_troubleshooting`, common, "state");
            /**
            common = {
                type: "number",
                role: "state",
                name: "VIS",
                desc: "VIS",
                read: true,
                write: true,
                def: 0,
            };
            await this.createDataPoint(`${mower.serial_number}.mower.slab`, common, "state");
            */
        } else {
            for (let a = 0; a <= 3; a++) {
                await this.setObjectNotExistsAsync(`${mower.serial_number}.areas.area_${a}`, {
                    type: "state",
                    common: {
                        name: `Area${a}`,
                        type: "number",
                        role: "state",
                        unit: "m",
                        read: true,
                        write: true,
                        desc: `Distance from Start point for area ${a}`,
                    },
                    native: {},
                });
            }
            common = {
                name: {
                    en: "Actual area",
                    de: "Tatsächlicher Bereich",
                    ru: "Фактический район",
                    pt: "Espaço real",
                    nl: "Actuele omgeving",
                    fr: "Surface effective",
                    it: "Superficie effettiva",
                    es: "Superficie real",
                    pl: "Obszar aktualny",
                    uk: "Загальна площа",
                    "zh-cn": "实际领域",
                },
                type: "number",
                role: "value",
                read: true,
                write: false,
                desc: "Show the current area",
            };
            await this.createDataPoint(`${mower.serial_number}.areas.actualArea`, common, "state");
            common = {
                name: {
                    en: "Next Sequence number",
                    de: "Nächste Sequenznummer",
                    ru: "Следующий номер последовательности",
                    pt: "Próximo número de sequência",
                    nl: "Volgende serienummer",
                    fr: "Prochain numéro de séquence",
                    it: "Prossimo numero di sequenza",
                    es: "Siguiente número de secuencia",
                    pl: "Następna liczba dni",
                    uk: "Наступна кількість",
                    "zh-cn": "今后离职人数",
                },
                type: "number",
                role: "value",
                read: true,
                write: false,
                desc: "Show the next sequence number",
            };
            await this.createDataPoint(`${mower.serial_number}.areas.actualAreaIndicator`, common, "state");
            common = {
                name: {
                    en: "Mowing times exceed",
                    de: "Mähzeiten übersteigen",
                    ru: "время шитья превышает",
                    pt: "Tempos de corte excedem",
                    nl: "Maaien overheen",
                    fr: "Temps de tonte dépasse",
                    it: "i tempi di cottura superano",
                    es: "tiempos de movimiento exceden",
                    pl: "czas przekroczenia",
                    uk: "час висіву перевищує",
                    "zh-cn": "时间超过时间",
                },
                type: "number",
                role: "state",
                read: true,
                write: true,
                unit: "%",
                desc: "Extend the mowing time",
            };
            await this.createDataPoint(`${mower.serial_number}.mower.mowTimeExtend`, common, "state");
            common = {
                name: {
                    en: "Time-controlled mowing",
                    de: "Zeitgesteuertes Mähen",
                    ru: "Контролируемое временем крыло",
                    pt: "Costura controlada pelo tempo",
                    nl: "Time-controle maai",
                    fr: "Démarrage contrôlé par le temps",
                    it: "Cucitura controllata dal tempo",
                    es: "Mowing controlado por el tiempo",
                    pl: "Przewidywania czasowe",
                    uk: "Час керованого скошування",
                    "zh-cn": "时间控制的暴动",
                },
                type: "boolean",
                role: "switch",
                read: true,
                write: true,
                desc: "Time-controlled mowing",
            };
            await this.createDataPoint(`${mower.serial_number}.mower.mowerActive`, common, "state");
            states_cmd = {
                1: "Start",
                2: "Stop",
                3: "Home",
                4: "Start Zone Taining",
                5: "Lock",
                6: "Unlock",
                7: "Restart Robot",
                8: "pause when follow wire",
                9: "safe homing",
            };
        }

        common = {
            type: "string",
            role: "json",
            name: {
                en: "Start sequence",
                de: "Startsequenz",
                ru: "Начать последовательность",
                pt: "Sequência de início",
                nl: "Start de reeks",
                fr: "Démarrer la séquence",
                it: "Avviare la sequenza",
                es: "Secuencia de inicio",
                pl: "Sekwencja początkowa",
                uk: "Послідовність старту",
                "zh-cn": "启动顺序",
            },
            desc: "Sequence of area to start from",
            read: true,
            write: true,
        };
        await this.createDataPoint(`${mower.serial_number}.areas.startSequence`, common, "state");

        //calendar first schedule
        week_count = 0;
        for (const day of this.week) {
            common = {
                name: objects.weekname[week_count],
            };
            ++week_count;
            await this.createDataPoint(`${mower.serial_number}.calendar.${day}`, common, "channel");
            for (const o of objects.calendar) {
                await this.createDataPoint(
                    `${mower.serial_number}.calendar.${day}.${o._id}`,
                    o.common,
                    o.type,
                    o.native,
                );
            }
        }

        // mower
        common = {
            name: {
                en: "Last commands",
                de: "Letzte Befehle",
                ru: "Последние команды",
                pt: "Últimos comandos",
                nl: "Laatste bevelen",
                fr: "Dernières commandes",
                it: "Ultimi comandi",
                es: "Últimos comandos",
                pl: "Ostatnie dowództwo",
                uk: "Останні команди",
                "zh-cn": "上次指挥",
            },
            type: "string",
            role: "json",
            read: true,
            write: false,
            desc: "Last commands",
        };
        await this.createDataPoint(`${mower.serial_number}.mower.last_command`, common, "state");
        common = {
            name: {
                en: "Update data from MQTT",
                de: "Daten von MQTT aktualisieren",
                ru: "Обновить данные от MQTT",
                pt: "Atualizar dados do MQTT",
                nl: "Update gegevens van MQT",
                fr: "Mise à jour des données de MQTT",
                it: "Aggiornamento dei dati da MQTT",
                es: "Datos de actualización de MQTT",
                pl: "Data dostępu do MQTT",
                uk: "Оновлення даних з MQTT",
                "zh-cn": "技转中心最新数据",
            },
            type: "boolean",
            role: "button",
            read: true,
            write: true,
            def: false,
            desc: "Load data from Mqtt",
        };
        await this.createDataPoint(`${mower.serial_number}.mower.mqtt_update`, common, "state");
        common = {
            name: {
                en: "Max. 200 updates/day",
                de: "Max. 200 Updates/Tag",
                ru: "Макс. 200 обновлений/день",
                pt: "Max. 200 atualizações/dia",
                nl: "Max, 200 updates/day",
                fr: "Max. 200 mises à jour/jour",
                it: "Max. 200 aggiornamenti al giorno",
                es: "Max. 200 actualizaciones/día",
                pl: "Max, 200 aktualizacji/dzień",
                uk: "Макс. 200 оновлень/добу",
                "zh-cn": "Max.200更新/日",
            },
            type: "number",
            role: "value",
            read: true,
            write: false,
            def: 0,
            desc: "Max. 200 updates/day",
        };
        const native = {
            MIN: 0,
            MAX: 200,
            TIMES: 0,
            NEXT: 0,
        };
        await this.createDataPoint(`${mower.serial_number}.mower.mqtt_update_count`, common, "state", native);
        common = {
            name: {
                en: "Online",
                de: "Online",
                ru: "Онлайн",
                pt: "Online",
                nl: "Online",
                fr: "Online",
                it: "Online",
                es: "Online",
                pl: "Online",
                uk: "Інтернет",
                "zh-cn": "在线",
            },
            type: "boolean",
            role: "indicator.connected",
            read: true,
            write: false,
            desc: "If mower connected to cloud",
        };
        await this.createDataPoint(`${mower.serial_number}.mower.online`, common, "state");
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
        await this.createDataPoint(`${mower.serial_number}.mower.firmware`, common, "state");
        common = {
            name: {
                en: "Wifi quality",
                de: "Wifi Qualität",
                ru: "Качество Wifi",
                pt: "Qualidade de Wifi",
                nl: "Wifi kwaliteit",
                fr: "Qualité Wifi",
                it: "Qualità Wifi",
                es: "Calidad Wifi",
                pl: "Jakości Wifi",
                uk: "Якість Wifi",
                "zh-cn": "纤维质量",
            },
            type: "number",
            role: "value",
            read: true,
            write: false,
            unit: "dBm",
            desc: "Prozent of Wifi quality",
        };
        await this.createDataPoint(`${mower.serial_number}.mower.wifiQuality`, common, "state");
        common = {
            name: {
                en: "Battery charge cycle",
                de: "Batterieladezyklus",
                ru: "Цикл заряда батареи",
                pt: "Ciclo de carga da bateria",
                nl: "Batterij lading cyclus",
                fr: "Cycle de charge de la batterie",
                it: "Ciclo di carica della batteria",
                es: "Ciclo de carga de batería",
                pl: "Cykl badawczy",
                uk: "Цикл заряду акумулятора",
                "zh-cn": "包 费周期",
            },
            type: "number",
            role: "indicator",
            read: true,
            write: false,
            desc: "Show the number of charging cycles",
        };
        await this.createDataPoint(`${mower.serial_number}.mower.batteryChargeCycle`, common, "state");
        common = {
            name: {
                en: "Battery charger state",
                de: "Batterieladezustand",
                ru: "Батарея зарядное устройство состояние",
                pt: "Estado do carregador da bateria",
                nl: "Batterijaanklager staat",
                fr: "État du chargeur de batterie",
                it: "Caricabatterie stato",
                es: "Estado cargador de batería",
                pl: "Bateria charger",
                uk: "Стан зарядного пристрою акумулятора",
                "zh-cn": "巴莱特州",
            },
            type: "boolean",
            role: "indicator",
            read: true,
            write: false,
            desc: "Battery charger state",
        };
        await this.createDataPoint(`${mower.serial_number}.mower.batteryCharging`, common, "state");
        common = {
            name: {
                en: "Reset blade time",
                de: "Klingenzeit zurücksetzen",
                ru: "Сбросить время лезвия",
                pt: "Repor o tempo da lâmina",
                nl: "Reset mestijd",
                fr: "Réinitialiser le temps de la lame",
                it: "Tempo di taglio della lama",
                es: "Tiempo de restauración de la hoja",
                pl: "Czasoprzestrzeni",
                uk: "Відновити час лопаті",
                "zh-cn": "时间分散",
            },
            type: "boolean",
            role: "switch",
            read: true,
            write: true,
            desc: "Reset blade time",
            def: false,
        };
        await this.createDataPoint(`${mower.serial_number}.mower.reset_blade_time`, common, "state");
        await this.setStateAsync(`${mower.serial_number}.mower.reset_blade_time`, {
            val: false,
            ack: true,
        });
        common = {
            name: {
                en: "Approval blade time reset",
                de: "Freigabe der Klingenzeitrückstellung",
                ru: "Одобрение времени сброса",
                pt: "Reposição do tempo da lâmina de aprovação",
                nl: "Goedkeuringsmes",
                fr: "Réinitialisation du délai d ' homologation",
                it: "Ripristino del tempo della lama approvazione",
                es: "Tiempo de reajuste de la hoja de aprobación",
                pl: "Czas resetowania",
                uk: "Затвердити час скидання леза",
                "zh-cn": "核准时间重新出现",
            },
            type: "boolean",
            role: "button",
            read: true,
            write: true,
            desc: "Approval blade time reset",
            def: false,
        };
        await this.createDataPoint(`${mower.serial_number}.mower.reset_blade_time_approved`, common, "state");
        common = {
            name: {
                en: "Reset battery time",
                de: "Batteriezeit zurücksetzen",
                ru: "Сбросить время батареи",
                pt: "Repor o tempo da bateria",
                nl: "Reset batterij tijd",
                fr: "Réinitialiser le temps de batterie",
                it: "Ripristinare il tempo della batteria",
                es: "Reiniciar el tiempo de la batería",
                pl: "Baterie",
                uk: "Час акумулятора",
                "zh-cn": "电池时",
            },
            type: "boolean",
            role: "switch",
            read: true,
            write: true,
            desc: "Reset blade time",
            def: false,
        };
        await this.createDataPoint(`${mower.serial_number}.mower.reset_battery_time`, common, "state");
        await this.setStateAsync(`${mower.serial_number}.mower.reset_battery_time`, {
            val: false,
            ack: true,
        });
        common = {
            name: {
                en: "Approval battery time reset",
                de: "Genehmigung Batteriezeitrückstellung",
                ru: "Одобрение сброса времени батареи",
                pt: "Reabilitação do tempo da bateria",
                nl: "Goedkeuringsbatterij tijd reset",
                fr: "Réinitialisation du temps de batterie d ' homologation",
                it: "Ripristino del tempo della batteria",
                es: "Tiempo de recuperación de la batería",
                pl: "Czas resetowania",
                uk: "Затвердження часу батареї",
                "zh-cn": "核准电池时间重新爆发",
            },
            type: "boolean",
            role: "button",
            read: true,
            write: true,
            desc: "Approval battery time reset",
            def: false,
        };
        await this.createDataPoint(`${mower.serial_number}.mower.reset_battery_time_approved`, common, "state");
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
        await this.createDataPoint(`${mower.serial_number}.mower.batteryState`, common, "state");
        common = {
            name: {
                en: "Battery temperature",
                de: "Batterietemperatur",
                ru: "Температура батареи",
                pt: "Temperatura da bateria",
                nl: "Batterijttemperatuur",
                fr: "Température de la batterie",
                it: "Temperatura della batteria",
                es: "Temperatura de la batería",
                pl: "Temperatura",
                uk: "Температура акумулятора",
                "zh-cn": "B. 燃烧温度",
            },
            type: "number",
            role: "value.temperature",
            read: true,
            write: false,
            unit: "°C",
            desc: "Temperature of movers battery",
        };
        await this.createDataPoint(`${mower.serial_number}.mower.batteryTemperature`, common, "state");
        common = {
            name: {
                en: "Battery voltage",
                de: "Batteriespannung",
                ru: "Напряжение батареи",
                pt: "Tensão da bateria",
                nl: "Batterij voltage",
                fr: "Tension de la batterie",
                it: "Tensione della batteria",
                es: "Tensión de la batería",
                pl: "Napięcie",
                uk: "Напруга акумулятора",
                "zh-cn": "1. Battertage",
            },
            type: "number",
            role: "value.voltage",
            read: true,
            write: false,
            unit: "V",
            desc: "Voltage of movers battery",
        };
        await this.createDataPoint(`${mower.serial_number}.mower.batteryVoltage`, common, "state");
        //{ App translate
        //    14:"Battery charging error",
        //    12:"Battery low",
        //    :"Battery Over Temperature",
        //    17:"Battery temperature out of range",
        //    8:"Blade blocked",
        //    :"Calibration needed",
        //    110:"Camera error",
        //    :"Camera lens is dirty",
        //    :"Camera light too low",
        //    :"Charging station docking error",
        //    6:"Close door to cut",
        //    7:"Close door to go home",
        //    :"Excessive slope",
        //    :"HBI error",
        //    :"Headlight error",
        //    15:"Cannot find base",
        //    :"No Position",
        //    2:"Landroid lifted",
        //    16:"Unlock your Landroid to start working again",
        //    :"Map error",
        //    :"Lawn exploration failed",
        //    111:"Lawn exploration required",
        //    :"Firmware upgrade error",
        //    4:"Landroid outside boundary",
        //    13:"Reverse wire",
        //    :"RFID reader error",
        //    :"Map training start not allowed",
        //    1:"Landroid Trapped",
        //    10:"Trapped - safety time out",
        //    19:"Open battery cover",
        //    :"Unknown",
        //    :"Unreachable charging station",
        //    :"Unreachable zone",
        //    11:"Landroid upside down",
        //    9:"Wheel motor error",
        //    3:"Wire missing",
        //    20:"Wire signal out of sync",
        //    0:"No Error",
        //    5:"Raining",
        //    21:"msg num",
        //    18:"dummy model"
        //}
        common = {
            name: {
                en: "Error code",
                de: "Fehlercode",
                ru: "Код ошибки",
                pt: "Código de erro",
                nl: "Errorcode",
                fr: "Code d ' erreur",
                it: "Codice errore",
                es: "Código de error",
                pl: "Kod Error",
                uk: "Код помилки",
                "zh-cn": "导 言",
            },
            type: "number",
            role: "value",
            read: true,
            write: false,
            desc: "Error code",
            states: {
                0: "No error",
                1: "Trapped",
                2: "Lifted",
                3: "Wire missing",
                4: "Outside wire",
                5: "Raining",
                6: "Close door to mow",
                7: "Close door to go home",
                8: "Blade motor blocked",
                9: "Wheel motor blocked",
                10: "Landroid hangs solid",
                11: "Upside down",
                12: "Battery low",
                13: "Reverse wire",
                14: "Charge error",
                15: "Timeout finding home",
                16: "Mower locked",
                17: "Battery over temperature",
                18: "dummy model",
                19: "Battery trunk open timeout",
                20: "wire sync",
                21: "msg num",
                110: "Camera error",
                111: "Lawn exploration required",
            },
        };
        await this.createDataPoint(`${mower.serial_number}.mower.error`, common, "state");
        common = {
            name: {
                en: "Pause",
                de: "Pause",
                ru: "Пауза",
                pt: "Pausa",
                nl: "Pauze",
                fr: "Pause",
                it: "Pausa",
                es: "Pausa",
                pl: "Pause",
                uk: "Пауза",
                "zh-cn": "口粮",
            },
            type: "boolean",
            role: "button.stop",
            read: true,
            write: true,
            desc: "Pause the mover",
            def: false,
        };
        await this.createDataPoint(`${mower.serial_number}.mower.pause`, common, "state");
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
            role: "button",
            read: true,
            write: true,
            desc: "start edge cutting",
            def: false,
        };
        await this.createDataPoint(`${mower.serial_number}.mower.edgecut`, common, "state");
        common = {
            name: {
                en: "Start or Stop",
                de: "Starten oder stoppen",
                ru: "Старт или Стоп",
                pt: "Iniciar ou Parar",
                nl: "Begin of stop",
                fr: "Commencer ou arrêter",
                it: "Avviare o interrompere",
                es: "Inicio o Pare",
                pl: "Start lub Stop",
                uk: "Почати або Зупинити",
                "zh-cn": "启动或禁止",
            },
            type: "boolean",
            role: "switch",
            read: true,
            write: true,
            desc: "Start and stop the mover",
        };
        await this.createDataPoint(`${mower.serial_number}.mower.state`, common, "state");
        //Available from version >= RLM v3.29b88 02-05-2023
        if (
            mower.last_status != null &&
            mower.last_status.payload != null &&
            mower.last_status.payload.cfg != null &&
            mower.last_status.payload.cfg.mzk != null
        ) {
            this.log.info("Multi-ZoneKeeper found! Create State : zoneKeeper");
            common = {
                name: {
                    en: "Zone Keeper",
                    de: "Gebietshalter",
                    ru: "Зона Keeper",
                    pt: "Guardião de Zona",
                    nl: "Zone Keeper",
                    fr: "Zone Keeper",
                    it: "Zone Keeper",
                    es: "Zone Keeper",
                    pl: "Strefa Keeper",
                    uk: "Зона Тример",
                    "zh-cn": "凯尔区",
                },
                type: "boolean",
                role: "switch",
                read: true,
                write: true,
                def: false,
                desc: "Multi-ZoneKeeper",
            };
            await this.createDataPoint(`${mower.serial_number}.areas.zoneKeeper`, common, "state");
        }
        //{ App translate
        //    "33":"Searching zone",
        //    "31":"Zone training",
        //    "32":"Cutting border",
        //    "":"Charging", // Muss ich abfragen
        //    "":"Map training (completable)",
        //    "":"Error",
        //    "":"Upgrading firmware",
        //    "":"Training",
        //    "30":"Going home",
        //    "5":"Going home",
        //    "1":"Home",
        //    "0":"Idle",
        //    "0":"Manual stop", // Muss ich abfragen status + error === 0
        //    "":"Downloading map",
        //    "":"Processing map",
        //    "":"Moving to zone",
        //    "":"Activate SIM",
        //    "":"The geo-fence is not enabled",
        //    "":"Missing Landroid position",
        //    "":"Landroid is out of the geo-fence",
        //    "":"Landroid paused. If you do not resume mowing within %1$d minutes, it will power off.",
        //    "":"If you don’t resume it from pause mode by either tapping “start” or “home” within %1$d minutes, you will have to turn it on manually.",
        //    "":"Due to international safety regulations, your Landroid cannot stay in pause mode for longer than %1$d minutes. Once this time lapses, it must power off.",
        //    "":"Set Landroid location to enable weather conditions",
        //    "":"SIM activation error",
        //    "":"SIM activation in progress",
        //    "":"SIM contract has expired",
        //    "":"Weather info not available at this time",
        //    "":"Weather information by OpenWeatherMap",
        //    "7":"Mowing",
        //    "":"Map training (not completable)",
        //    "34":"Pause",
        //    "":"%1$s activation in progress",
        //    "":"Rain Delay",
        //    "":"Party mode", // Muss ich abfragen
        //    "6":"Searching border",
        //    "3":"Starting",
        //    "":"Unknown",
        //    "2": "Start sequence",
        //    "4": "Follow wire",
        //    "8": "Lifted",
        //    "9": "Trapped",
        //    "10": "Blade blocked",
        //    "11": "Debug",
        //    "12": "Remote control",
        //    "13": "escape from off limits",
        //}
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
            type: "number",
            role: "indicator",
            read: true,
            write: false,
            desc: "Current status of lawn mower",
            states: {
                0: "IDLE",
                1: "Home",
                2: "Start sequence",
                3: "Leaving home",
                4: "Follow wire",
                5: "Searching home",
                6: "Searching wire",
                7: "Mowing",
                8: "Lifted",
                9: "Trapped",
                10: "Blade blocked",
                11: "Debug",
                12: "Remote control",
                13: "escape from off limits",
                30: "Going home",
                31: "Zone training",
                32: "Border Cut",
                33: "Searching zone",
                34: "Pause",
            },
        };
        await this.createDataPoint(`${mower.serial_number}.mower.status`, common, "state");
        common = {
            name: {
                en: "Runtime of the blades.",
                de: "Laufzeit der Klingen.",
                ru: "Продолжительность клинков.",
                pt: "Tempo de execução das lâminas.",
                nl: "Rentijd van de messen.",
                fr: "Durée des lames.",
                it: "Tempo di esecuzione delle lame.",
                es: "Hora de correr de las cuchillas.",
                pl: "Czas strzałów.",
                uk: "Режим роботи леза.",
                "zh-cn": "排房时间。.",
            },
            type: "number",
            role: "value.interval",
            read: true,
            write: false,
            unit: this.config.meterMin ? "min." : "h",
            desc: "Total blade is running",
        };
        await this.createDataPoint(`${mower.serial_number}.mower.totalBladeTime`, common, "state");
        common = {
            name: {
                en: "Total mowing distance",
                de: "Gesamte Mähdistanz",
                ru: "Общее расстояние крыла",
                pt: "Distância total de moagem",
                nl: "Totale maaien afstand",
                fr: "Distance totale",
                it: "Distanza totale di cucito",
                es: "Distancia total de movimiento",
                pl: "Łączna odległość",
                uk: "Загальна відстань посіву",
                "zh-cn": "距离总额",
            },
            type: "number",
            role: "value.interval",
            read: true,
            write: false,
            unit: this.config.meterMin ? "m" : "Km",
            desc: "Total distance the mower has been mowing in km",
        };
        await this.createDataPoint(`${mower.serial_number}.mower.totalDistance`, common, "state");
        common = {
            name: {
                en: "Total mower work time",
                de: "Mähwerkszeit insgesamt",
                ru: "Общее время работы косилки",
                pt: "Tempo de trabalho do cortador total",
                nl: "Totale maaientijd",
                fr: "Temps de travail total de la tondeuse",
                it: "Tempo totale di lavoro del tosaerba",
                es: "Tiempo total de trabajo de corta distancia",
                pl: "Czas pracy",
                uk: "Час роботи косарки",
                "zh-cn": "工时总数",
            },
            type: "number",
            role: "value.interval",
            read: true,
            write: false,
            unit: this.config.meterMin ? "min." : "h",
            desc: "Total distance the mower has been mowing in hours",
        };
        await this.createDataPoint(`${mower.serial_number}.mower.totalTime`, common, "state");
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
            write: true,
            unit: "min",
            desc: "Time to wait after rain, in minutes",
        };
        await this.createDataPoint(`${mower.serial_number}.mower.waitRain`, common, "state");
        common = {
            name: {
                en: "Send command",
                de: "Befehl senden",
                ru: "Отправить команду",
                pt: "Enviar comando",
                nl: "Stuur het bevel",
                fr: "Envoyer la commande",
                it: "Invia comando",
                es: "Enviar comando",
                pl: "Dowództwo Senatu",
                uk: "Надіслати команду",
                "zh-cn": "总指挥",
            },
            type: "number",
            role: "value",
            read: true,
            write: true,
            desc: "send Command to Landroid",
            states: states_cmd,
        };
        await this.createDataPoint(`${mower.serial_number}.mower.sendCommand`, common, "state");
        common = {
            name: {
                en: "gradient",
                de: "Gefälle oder Anstieg",
                ru: "градиент",
                pt: "gradient",
                nl: "gradiënt",
                fr: "gradient",
                it: "gradiente",
                es: "gradiente",
                pl: "gradient",
                uk: "градієнта",
                "zh-cn": "评 注",
            },
            type: "number",
            role: "value.interval",
            read: true,
            write: false,
            unit: "°",
            desc: "Gradient from the mower",
        };
        await this.createDataPoint(`${mower.serial_number}.mower.gradient`, common, "state");
        common = {
            name: {
                en: "Inclination",
                de: "Neigung",
                ru: "наклон",
                pt: "Inclinação",
                nl: "Inclinatie",
                fr: "Inclinaison",
                it: "Inclinazione",
                es: "Inclinación",
                pl: "skłonność",
                uk: "Iнклінація",
                "zh-cn": "智",
            },
            type: "number",
            role: "value.interval",
            read: true,
            write: false,
            unit: "°",
            desc: "Inclination from the mower",
        };
        await this.createDataPoint(`${mower.serial_number}.mower.inclination`, common, "state");
        common = {
            name: {
                en: "Direction",
                de: "Richtung",
                ru: "Направление",
                pt: "Direcção",
                nl: "Direction",
                fr: "Direction",
                it: "Direzione",
                es: "Dirección",
                pl: "Direction",
                uk: "Навігація",
                "zh-cn": "指示",
            },
            type: "number",
            role: "value.interval",
            read: true,
            write: false,
            unit: "°",
            desc: "Direction from the mower",
        };
        await this.createDataPoint(`${mower.serial_number}.mower.direction`, common, "state");
    },
    async setStates(mower) {
        if (mower) {
            await this.setStateAsync(`${mower.serial_number}.mower.online`, mower.online, true);
        }
        if (!mower || !mower.last_status || !mower.last_status.payload) {
            this.log.info("No payload found");
            return;
        }

        const data = mower.last_status.payload;
        //mower set states
        const sequence = [];
        //data = testmsg
        this.log.debug(`GET MQTT DATA from API: ${JSON.stringify(data)}`);

        //catch error if onj is empty
        if (Object.keys(data).length === 0 && data.constructor === Object) {
            this.log.debug("GET Empty MQTT DATA from API");
            return;
        }

        // catch if JSON contain other data e.g. {"ota":"ota fail","mac":"XXXXXXXXXXXX"}"
        if (data.dat == null || data.cfg == null) {
            this.log.info(`No data Message: ${JSON.stringify(data)}`);
            return;
        }
        try {
            if (this.config.meterMin) {
                await this.setStateAsync(`${mower.serial_number}.mower.totalTime`, {
                    val: data.dat.st && data.dat.st.wt ? parseFloat(data.dat.st.wt.toFixed(2)) : null,
                    ack: true,
                });
                await this.setStateAsync(`${mower.serial_number}.mower.totalDistance`, {
                    val: data.dat.st && data.dat.st.d ? parseFloat(data.dat.st.d.toFixed(2)) : null,
                    ack: true,
                });
                await this.setStateAsync(`${mower.serial_number}.mower.totalBladeTime`, {
                    val: data.dat.st && data.dat.st.b ? parseFloat(data.dat.st.b.toFixed(2)) : null,
                    ack: true,
                });
            } else {
                await this.setStateAsync(`${mower.serial_number}.mower.totalTime`, {
                    val: data.dat.st && data.dat.st.wt ? parseFloat((data.dat.st.wt / 6 / 10).toFixed(2)) : null,
                    ack: true,
                });
                await this.setStateAsync(`${mower.serial_number}.mower.totalDistance`, {
                    val: data.dat.st && data.dat.st.d ? parseFloat((data.dat.st.d / 100 / 10).toFixed(2)) : null,
                    ack: true,
                });
                await this.setStateAsync(`${mower.serial_number}.mower.totalBladeTime`, {
                    val: data.dat.st && data.dat.st.b ? parseFloat((data.dat.st.b / 6 / 10).toFixed(2)) : null,
                    ack: true,
                });
            }
            await this.setStateAsync(`${mower.serial_number}.mower.gradient`, {
                val: data.dat.dmp && data.dat.dmp[0] ? data.dat.dmp[0] : 0,
                ack: true,
            });
            await this.setStateAsync(`${mower.serial_number}.mower.inclination`, {
                val: data.dat.dmp && data.dat.dmp[1] ? data.dat.dmp[1] : 0,
                ack: true,
            });
            await this.setStateAsync(`${mower.serial_number}.mower.direction`, {
                val: data.dat.dmp && data.dat.dmp[2] ? data.dat.dmp[2] : 0,
                ack: true,
            });

            await this.setStateAsync(`${mower.serial_number}.mower.batteryChargeCycle`, {
                val: data.dat.bt && data.dat.bt.nr ? data.dat.bt.nr : null,
                ack: true,
            });
            await this.setStateAsync(`${mower.serial_number}.mower.batteryCharging`, {
                val: data.dat.bt && data.dat.bt.c ? true : false,
                ack: true,
            });
            await this.setStateAsync(`${mower.serial_number}.mower.batteryVoltage`, {
                val: data.dat.bt && data.dat.bt.v ? data.dat.bt.v : null,
                ack: true,
            });
            await this.setStateAsync(`${mower.serial_number}.mower.batteryTemperature`, {
                val: data.dat.bt && data.dat.bt.t ? data.dat.bt.t : null,
                ack: true,
            });
            await this.setStateAsync(`${mower.serial_number}.mower.error`, {
                val: data.dat && data.dat.le ? data.dat.le : 0,
                ack: true,
            });
            this.log.debug(`Test Status: ${data.dat && data.dat.ls ? data.dat.ls : 0}`);
            await this.setStateAsync(`${mower.serial_number}.mower.status`, {
                val: data.dat && data.dat.ls ? data.dat.ls : 0,
                ack: true,
            });
            //mzk = 1/0 -> Only comes via MQTT
            data.cfg.mzk != null &&
                (await this.setStateAsync(`${mower.serial_number}.areas.zoneKeeper`, {
                    val: data.cfg.mzk ? true : false,
                    ack: true,
                }));
            if (data && data.dat && data.dat.ls != null && data.dat.le != null) {
                if (
                    this.laststatus[mower.serial_number] != null &&
                    this.lasterror[mower.serial_number] != null &&
                    (this.lasterror[mower.serial_number] !== data.dat.le ||
                        this.laststatus[mower.serial_number] !== data.dat.ls)
                ) {
                    this.log.debug("SET loadActivity on true");
                    this.laststatus[mower.serial_number] = data.dat.ls;
                    this.lasterror[mower.serial_number] = data.dat.le;
                    this.loadActivity[mower.serial_number] = true;
                }
            }
            await this.setStateAsync(`${mower.serial_number}.mower.wifiQuality`, {
                val: data.dat && data.dat.rsi ? data.dat.rsi : 0,
                ack: true,
            });
            const state = data.dat && data.dat.ls ? data.dat.ls : 0;
            const error = data.dat && data.dat.le ? data.dat.le : 0;
            if (mower.capabilities != null && mower.capabilities.includes("vision")) {
                //Vision Schedule
                if (data.cfg.sc && data.cfg.sc.slots) {
                    data.cfg.sc.slots = await this.evaluateVisionCalendar(mower, data.cfg.sc.slots);
                }
                if (data.dat && data.dat.rfid) {
                    await this.setStateAsync(`${mower.serial_number}.areas.rfid`, {
                        val: data.dat.rfid.status,
                        ack: true,
                    });
                }

                if (data.cfg.log && data.cfg.log.imp != null) {
                    await this.setStateAsync(`${mower.serial_number}.mower.log_improvement`, {
                        val: data.cfg.log.imp ? true : false,
                        ack: true,
                    });
                }
                /**
                if (data.cfg.vis && data.cfg.vis.slab != null) {
                    await this.setStateAsync(`${mower.serial_number}.mower.slab`, {
                        val: data.cfg.vis.slab,
                        ack: true,
                    });
                }
                */
                if (data.cfg.log && data.cfg.log.diag != null) {
                    await this.setStateAsync(`${mower.serial_number}.mower.log_troubleshooting`, {
                        val: data.cfg.log.diag ? true : false,
                        ack: true,
                    });
                }
                this.log.debug("MOWER with full schedule: " + JSON.stringify(mower));
                //mower.last_status.payload
                if (data.cfg.sc && data.cfg.sc.once && data.cfg.sc.once.time != null) {
                    if (data.cfg.sc.once.cfg && data.cfg.sc.once.cfg.cut && data.cfg.sc.once.cfg.cut.b != null) {
                        await this.setStateAsync(`${mower.serial_number}.mower.oneTimeWithBorder`, {
                            val: data.cfg.sc.once.cfg.cut.b ? true : false,
                            ack: true,
                        });
                    }
                    await this.setStateAsync(`${mower.serial_number}.mower.oneTimeWorkTime`, {
                        val: data.cfg.sc.once.time,
                        ack: true,
                    });
                    await this.setStateAsync(`${mower.serial_number}.mower.oneTimeJson`, {
                        val: JSON.stringify(data.cfg.sc.once),
                        ack: true,
                    });
                }
                // Vision PartyModus
                if (data.cfg.sc && data.cfg.sc.enabled != null) {
                    await this.setStateAsync(`${mower.serial_number}.mower.partyModus`, {
                        val: data.cfg.sc && data.cfg.sc.enabled ? false : true,
                        ack: true,
                    });
                }
                // Vision Paused
                if (data.cfg.sc && data.cfg.sc.paused != null) {
                    await this.setStateAsync(`${mower.serial_number}.mower.paused`, {
                        val: data.cfg.sc.paused,
                        ack: true,
                    });
                }
                if (data.cfg.mz != null) {
                    await this.setStateAsync(`${mower.serial_number}.areas.startSequence`, {
                        val: JSON.stringify(data.cfg.mz),
                        ack: true,
                    });
                }
            } else {
                await this.setStateAsync(`${mower.serial_number}.mower.mowerActive`, {
                    val: data.cfg.sc && data.cfg.sc.m ? true : false,
                    ack: true,
                });
                await this.setStateAsync(`${mower.serial_number}.mower.mowTimeExtend`, {
                    val: data.cfg.sc && data.cfg.sc.p ? data.cfg.sc.p : 0,
                    ack: true,
                });
                // sort Areas
                await this.setStateAsync(`${mower.serial_number}.areas.area_0`, {
                    val: data.cfg.mz && data.cfg.mz[0] ? data.cfg.mz[0] : 0,
                    ack: true,
                });
                await this.setStateAsync(`${mower.serial_number}.areas.area_1`, {
                    val: data.cfg.mz && data.cfg.mz[1] ? data.cfg.mz[1] : 0,
                    ack: true,
                });
                await this.setStateAsync(`${mower.serial_number}.areas.area_2`, {
                    val: data.cfg.mz && data.cfg.mz[2] ? data.cfg.mz[2] : 0,
                    ack: true,
                });
                await this.setStateAsync(`${mower.serial_number}.areas.area_3`, {
                    val: data.cfg.mz && data.cfg.mz[3] ? data.cfg.mz[3] : 0,
                    ack: true,
                });
                await this.setStateAsync(`${mower.serial_number}.areas.actualArea`, {
                    val: data.dat && data.cfg && data.cfg.mzv ? data.cfg.mzv[data.dat.lz] : null,
                    ack: true,
                });
                await this.setStateAsync(`${mower.serial_number}.areas.actualAreaIndicator`, {
                    val: data.dat && data.dat.lz ? data.dat.lz : null,
                    ack: true,
                });
                if (data.cfg.mzv) {
                    for (let i = 0; i < data.cfg.mzv.length; i++) {
                        //  adapter.setState("areas.startSequence", { val: data.cfg.mzv[i], ack: true });
                        sequence.push(data.cfg.mzv[i]);
                    }
                    await this.setStateAsync(`${mower.serial_number}.areas.startSequence`, {
                        val: JSON.stringify(sequence),
                        ack: true,
                    });
                }
                if (data.cfg.sc && data.cfg.sc.d) {
                    this.evaluateCalendar(mower, data.cfg.sc.d, false);
                }
                // Second Mowtime
                if (data.cfg.sc && data.cfg.sc.dd) {
                    this.evaluateCalendar(mower, data.cfg.sc.dd, true);
                }
                // 1TimeShedule
                if (data.cfg.sc && data.cfg.sc.ots) {
                    await this.setStateAsync(`${mower.serial_number}.mower.oneTimeWithBorder`, {
                        val: data.cfg.sc.ots.bc ? true : false,
                        ack: true,
                    });
                    await this.setStateAsync(`${mower.serial_number}.mower.oneTimeWorkTime`, {
                        val: data.cfg.sc.ots.wtm,
                        ack: true,
                    });
                    await this.setStateAsync(`${mower.serial_number}.mower.oneTimeJson`, {
                        val: JSON.stringify(data.cfg.sc.ots),
                        ack: true,
                    });
                }
                // PartyModus
                if (data.cfg.sc && data.cfg.sc.distm != null && data.cfg.sc.m != null) {
                    await this.setStateAsync(`${mower.serial_number}.mower.partyModus`, {
                        val: data.cfg.sc.m === 2 ? true : false,
                        ack: true,
                    });
                }
                //JSON week
                if (data.cfg.sc && data.cfg.sc.d) {
                    await this.setStateAsync(`${mower.serial_number}.calendar.calJson`, {
                        val: JSON.stringify(data.cfg.sc.d),
                        ack: true,
                    });
                }
                if (data.cfg.sc && data.cfg.sc.dd) {
                    await this.setStateAsync(`${mower.serial_number}.calendar.calJson2`, {
                        val: JSON.stringify(data.cfg.sc.dd),
                        ack: true,
                    });
                }
            }

            // edgecutting
            if (this.modules[mower.serial_number].edgeCut && (state === 1 || state === 3)) {
                this.log.debug(`Edgecut Start section :${state}`);
            } else if (state === 31 && this.modules[mower.serial_number].edgeCut) {
                setTimeout(() => {
                    this.log.debug("Edgecut send cmd:2");
                    this.sendMessage('{"cmd":2}', mower.serial_number, "Start_sequence");
                }, this.config.edgeCutDelay);
            } else if (state === 34 && this.modules[mower.serial_number].edgeCut) {
                this.log.debug("Edgecut send cmd:3");
                this.sendMessage('{"cmd":3}', mower.serial_number, "Leaving_home");
                this.modules[mower.serial_number].edgeCut = false;
            } else if (mower.edgeCut === true && state !== 31 && state !== 34) {
                this.modules[mower.serial_number].edgeCut = false;
                this.log.warn("Something went wrong at edgeCut");
            }

            await this.setStateAsync(`${mower.serial_number}.mower.firmware`, {
                val: data.dat && data.dat.fw ? parseFloat(data.dat.fw) : 0, //current vision issue
                ack: true,
            });
            await this.setStateAsync(`${mower.serial_number}.mower.waitRain`, {
                val: data.cfg.rd,
                ack: true,
            });
            data.dat.bt &&
                (await this.setStateAsync(`${mower.serial_number}.mower.batteryState`, {
                    val: data.dat.bt.p,
                    ack: true,
                }));

            if ((state === 7 || state === 9) && error === 0) {
                await this.setStateAsync(`${mower.serial_number}.mower.state`, {
                    val: true,
                    ack: true,
                });
            } else {
                await this.setStateAsync(`${mower.serial_number}.mower.state`, {
                    val: false,
                    ack: true,
                });
            }

            //
            //torque control found
            if (data && data.cfg && data.cfg.tq != null) {
                if (this.modules[mower.serial_number]["tq"] == null) {
                    this.log.info("Torque control found, create states...");
                    for (const o of objects.module_tq) {
                        await this.createDataPoint(`${mower.serial_number}.mower.${o._id}`, o.common, o.type, o.native);
                    }
                }
                this.modules[mower.serial_number]["tq"] = data.cfg.tq;
                await this.setStateAsync(`${mower.serial_number}.mower.torque`, {
                    val: parseInt(data.cfg.tq),
                    ack: true,
                });
            }

            //modules
            if (data.cfg.modules && !this.modules[mower.serial_number].channel) {
                const common = {
                    name: {
                        en: "Mower modules",
                        de: "Mähmodule",
                        ru: "Мовер модули",
                        pt: "Módulos de esgoto",
                        nl: "Mower modules",
                        fr: "Modules d ' amorçage",
                        it: "Moduli motore",
                        es: "Mower modules",
                        pl: "Moduł Mowera",
                        uk: "Модулі косарки",
                        "zh-cn": "模块",
                    },
                };
                await this.createDataPoint(`${mower.serial_number}.modules`, common, "channel");
                this.modules[mower.serial_number].channel = true;
            }

            //4G Module
            if (data.cfg.modules && data.cfg.modules["4G"] && data.cfg.modules["4G"]["geo"]) {
                if (!this.modules[mower.serial_number]["4G"]) {
                    for (const o of objects.module_4g) {
                        await this.createDataPoint(
                            `${mower.serial_number}.modules.${o._id}`,
                            o.common,
                            o.type,
                            o.native,
                        );
                        this.log.info(`GPS Module found! Create State : ${o._id}`);
                    }
                }
                this.modules[mower.serial_number]["4G"] = data.cfg.modules["4G"];
                if (data.cfg.modules["4G"]["geo"]["coo"] && data.cfg.modules["4G"]["geo"]["coo"].length > 1) {
                    await this.setStateAsync(`${mower.serial_number}.modules.4G.longitude`, {
                        val: data.cfg.modules["4G"]["geo"]["coo"][1],
                        ack: true,
                    });
                    await this.setStateAsync(`${mower.serial_number}.modules.4G.latitude`, {
                        val: data.cfg.modules["4G"]["geo"]["coo"][0],
                        ack: true,
                    });
                }
            }
            //US Module
            if (data.cfg.modules && data.cfg.modules["US"]) {
                if (!this.modules[mower.serial_number]["US"]) {
                    for (const o of objects.US) {
                        await this.createDataPoint(
                            `${mower.serial_number}.modules.${o._id}`,
                            o.common,
                            o.type,
                            o.native,
                        );
                        this.log.info("ACS Module found! Create State : " + o._id);
                    }
                }
                this.modules[mower.serial_number]["US"] = data.cfg.modules["US"];
                await this.setStateAsync(mower.serial_number + ".modules.US.ACS", {
                    val: data.cfg.modules["US"]["enabled"],
                    ack: true,
                });
                await this.setStateAsync(mower.serial_number + ".modules.US.ACS_Status", {
                    val: data.dat.modules["US"]["stat"],
                    ack: true,
                });
            }
            /**
            //HL Module
            if (data.cfg.modules && data.cfg.modules["HL"]) {
                if (!this.modules[mower.serial_number]["HL"]) {
                    for (const o of objects.HL) {
                        await this.createDataPoint(
                            `${mower.serial_number}.modules.${o._id}`,
                            o.common,
                            o.type,
                            o.native,
                        );
                        this.log.info("HL Module found! Create State : " + o._id);
                    }
                }
                this.modules[mower.serial_number]["HL"] = data.cfg.modules["HL"];
                await this.setStateAsync(mower.serial_number + ".modules.HL.hl", {
                    val: data.cfg.modules["HL"]["enabled"],
                    ack: true,
                });
                await this.setStateAsync(mower.serial_number + ".modules.HL.HL_Status", {
                    val: data.dat.modules["HL"]["stat"],
                    ack: true,
                });
            }
             */
            // Df Module
            if (data.cfg.modules && data.cfg.modules.DF) {
                if (!this.modules[mower.serial_number].DF) {
                    for (const o of objects.module_df) {
                        await this.createDataPoint(
                            `${mower.serial_number}.modules.${o._id}`,
                            o.common,
                            o.type,
                            o.native,
                        );
                        this.log.info(`OffLimits Module found! Create State : ${o._id}`);
                    }
                }

                this.modules[mower.serial_number].DF = data.cfg.modules.DF;
                await this.setStateAsync(`${mower.serial_number}.modules.DF.OLMSwitch_Cutting`, {
                    val: data.cfg.modules && data.cfg.modules.DF ? !!data.cfg.modules.DF.cut : false,
                    ack: true,
                });
                await this.setStateAsync(`${mower.serial_number}.modules.DF.OLMSwitch_FastHoming`, {
                    val: data.cfg.modules && data.cfg.modules.DF ? !!data.cfg.modules.DF.fh : false,
                    ack: true,
                });
            }
            //Autolock feture
            if (data.cfg && data.cfg.al) {
                if (!this.modules[mower.serial_number].al) {
                    for (const o of objects.al) {
                        await this.createDataPoint(`${mower.serial_number}.mower.${o._id}`, o.common, o.type, o.native);
                        this.log.info(`Autolock found! Create State : ${o._id}`);
                    }
                }
                this.modules[mower.serial_number].al = data.cfg.al;
                // save last positive Value
                if (data.cfg.al.t > 0) this.modules[mower.serial_number]["al_last"] = data.cfg.al.t;

                await this.setStateAsync(`${mower.serial_number}.mower.AutoLock`, {
                    val: !!data.cfg.al.lvl,
                    ack: true,
                });
                await this.setStateAsync(`${mower.serial_number}.mower.AutoLockTimer`, {
                    val: data.cfg.al.t,
                    ack: true,
                });
            }
        } catch (error) {
            if (this.supportsFeature && this.supportsFeature("PLUGINS")) {
                const sentryInstance = this.getPluginInstance("sentry");
                if (sentryInstance) {
                    sentryInstance.getSentryObject().captureException(error, {
                        extra: {
                            "data:": JSON.stringify(data),
                        },
                    });
                }
            }
        }
    },
    async cleanupRaw(mower) {
        return new Promise((resolve) => {
            try {
                let generic = 0;
                let irrigation = 0;
                let set_arr = 0;
                let slots_save = [];
                if (
                    mower &&
                    mower.auto_schedule_settings &&
                    mower.auto_schedule_settings.exclusion_scheduler &&
                    mower.auto_schedule_settings.exclusion_scheduler.days &&
                    typeof mower.auto_schedule_settings.exclusion_scheduler.days === "object"
                ) {
                    for (const key in mower.auto_schedule_settings.exclusion_scheduler.days) {
                        if (
                            Object.keys(mower.auto_schedule_settings.exclusion_scheduler.days[key]["slots"]).length < 4
                        ) {
                            generic = 0;
                            irrigation = 0;
                            slots_save = mower.auto_schedule_settings.exclusion_scheduler.days[key]["slots"];
                            mower.auto_schedule_settings.exclusion_scheduler.days[key]["slots"] = [
                                { start_time: 0, duration: 0, reason: "" },
                                { start_time: 0, duration: 0, reason: "" },
                                { start_time: 0, duration: 0, reason: "" },
                                { start_time: 0, duration: 0, reason: "" },
                            ];
                            if (Object.keys(slots_save).length === 1) {
                                if (slots_save[0].reason === "generic") {
                                    set_arr = 0;
                                } else {
                                    set_arr = 2;
                                }
                                mower.auto_schedule_settings.exclusion_scheduler.days[key]["slots"][
                                    set_arr
                                ].start_time = slots_save[0].start_time;
                                mower.auto_schedule_settings.exclusion_scheduler.days[key]["slots"][set_arr].duration =
                                    slots_save[0].duration;
                                mower.auto_schedule_settings.exclusion_scheduler.days[key]["slots"][set_arr].reason =
                                    slots_save[0].reason;
                            } else if (Object.keys(slots_save).length > 1) {
                                for (const sl in slots_save) {
                                    if (slots_save[sl].reason === "generic" && generic === 0) {
                                        set_arr = 0;
                                        generic = 1;
                                    } else if (slots_save[sl].reason === "generic" && generic === 1) {
                                        set_arr = 1;
                                    } else if (slots_save[sl].reason === "irrigation" && irrigation === 0) {
                                        set_arr = 2;
                                        irrigation = 2;
                                    } else if (slots_save[sl].reason === "irrigation" && irrigation === 2) {
                                        set_arr = 3;
                                    }
                                    mower.auto_schedule_settings.exclusion_scheduler.days[key]["slots"][
                                        set_arr
                                    ].start_time = slots_save[sl].start_time;
                                    mower.auto_schedule_settings.exclusion_scheduler.days[key]["slots"][
                                        set_arr
                                    ].duration = slots_save[sl].duration;
                                    mower.auto_schedule_settings.exclusion_scheduler.days[key]["slots"][
                                        set_arr
                                    ].reason = slots_save[sl].reason;
                                }
                            }
                        }
                    }
                }
                if (
                    mower &&
                    mower.auto_schedule_settings &&
                    typeof mower.auto_schedule_settings.nutrition === "object" &&
                    mower.auto_schedule_settings.nutrition === null
                ) {
                    mower.auto_schedule_settings.nutrition = { n: 0, p: 0, k: 0 };
                }

                // if (mower && mower.pin_code != null) {
                //     if (mower.pin_code === null) mower.pin_code = 0;
                // }
                // if (mower && mower.sim != null) {
                //     if (mower.sim === null) delete mower.sim;
                // }
                // if (mower && mower.app_settings != null) {
                //     if (mower.app_settings === null) delete mower.app_settings;
                // }
                // if (mower && mower.pending_radio_link_validation != null) {
                //     if (mower.pending_radio_link_validation === null) delete mower.pending_radio_link_validation;
                // }
                // if (mower && mower.last_gps_status != null) {
                //     if (mower.last_gps_status === null) delete mower.last_gps_status;
                // }
                // if (mower && mower.blade_work_time_reset_at != null) {
                //     if (mower.blade_work_time_reset_at === null) mower.blade_work_time_reset_at = "";
                // }
                // if (mower && mower.battery_charge_cycles_reset_at != null) {
                //     if (mower.battery_charge_cycles_reset_at === null) mower.battery_charge_cycles_reset_at = "";
                // }
                resolve(mower);
            } catch (error) {
                this.log.error(`cleanupRaw: ${JSON.stringify(error)}`);
                delete mower.auto_schedule_settings;
                resolve(mower);
            }
        });
    },
    /**
     * @param {string} ident
     * @param {object} common
     * @param {string} types
     * @param {object|null|undefined} [native=null]
     */
    async createDataPoint(ident, common, types, native) {
        try {
            const nativvalue = !native ? { native: {} } : { native: native };
            const obj = await this.getObjectAsync(ident);
            if (!obj) {
                await this.setObjectNotExistsAsync(ident, {
                    type: types,
                    common: common,
                    ...nativvalue,
                }).catch((error) => {
                    this.log.warn(`createDataPoint: ${error}`);
                });
            } else {
                let ischange = false;
                if (Object.keys(obj.common).length == Object.keys(common).length) {
                    for (const key in common) {
                        if (obj.common[key] == null) {
                            ischange = true;
                            break;
                        } else if (JSON.stringify(obj.common[key]) != JSON.stringify(common[key])) {
                            ischange = true;
                            break;
                        }
                    }
                } else {
                    ischange = true;
                }
                if (JSON.stringify(obj.type) != JSON.stringify(types)) {
                    ischange = true;
                }
                if (native) {
                    if (Object.keys(obj.native).length == Object.keys(nativvalue.native).length) {
                        for (const key in obj.native) {
                            if (nativvalue.native[key] == null) {
                                ischange = true;
                                delete obj["native"];
                                obj["native"] = native;
                                break;
                            } else if (JSON.stringify(obj.native[key]) != JSON.stringify(nativvalue.native[key])) {
                                ischange = true;
                                obj.native[key] = nativvalue.native[key];
                                break;
                            }
                        }
                    } else {
                        ischange = true;
                    }
                }
                if (ischange) {
                    this.log.warn(`INFORMATION - Change common: ${this.namespace}.${ident}`);
                    delete obj["common"];
                    obj["common"] = common;
                    obj["type"] = types;
                    await this.setObjectAsync(ident, obj);
                }
            }
        } catch (error) {
            this.log.warn(`createDataPoint e: ${error}`);
        }
    },
};
