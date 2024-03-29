module.exports = {
    calendar_vision: [
        {
            _id: "borderCut",
            type: "state",
            common: {
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
                write: true,
                def: false,
                desc: "The mower cut border today",
            },
            native: {},
        },
        {
            _id: "enabled_time",
            type: "state",
            common: {
                name: {
                    en: "enabled or disabled",
                    de: "aktiviert oder deaktiviert",
                    ru: "включены или отключены",
                    pt: "habilitado ou desativado",
                    nl: "ingeschakeld of uitgeschakeld",
                    fr: "activé ou désactivé",
                    it: "abilitato o disattivato",
                    es: "habilitados o discapacitados",
                    pl: "włączone lub wyłączone",
                    uk: "ввімкнено або вимкнено",
                    "zh-cn": "已启用或已禁用",
                },
                type: "boolean",
                role: "switch",
                read: true,
                write: true,
                def: false,
                desc: "Time enabled or disabled",
            },
            native: {},
        },
        {
            _id: "zones",
            type: "state",
            common: {
                name: {
                    en: "Zones",
                    de: "Zonen",
                    ru: "Зоны",
                    pt: "Zonas",
                    nl: "Gebied",
                    fr: "Zones",
                    it: "Zone",
                    es: "Zonas",
                    pl: "Strefy",
                    uk: "Зони",
                    "zh-cn": "区",
                },
                type: "string",
                role: "json",
                read: true,
                write: true,
                def: JSON.stringify([]),
                desc: "Zones",
            },
            native: {},
        },
        {
            _id: "startTime",
            type: "state",
            common: {
                name: {
                    en: "Start time",
                    de: "Startzeit",
                    ru: "Начало",
                    pt: "Tempo de início",
                    nl: "Begin de tijd",
                    fr: "Temps de démarrage",
                    it: "Inizio",
                    es: "Hora de inicio",
                    pl: "Od razu",
                    uk: "Час початку",
                    "zh-cn": "启动时间",
                },
                type: "string",
                role: "state",
                read: true,
                write: true,
                def: "00:00",
                desc: "Hour:Minutes on this day that the Landroid should start mowing",
            },
            native: {},
        },
        {
            _id: "workTime",
            type: "state",
            common: {
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
                role: "value.interval",
                unit: "min.",
                read: true,
                write: true,
                def: 0,
                desc: "Decides for how long the mower will work on this day",
            },
            native: {},
        },
    ],
    calendar: [
        {
            _id: "borderCut",
            type: "state",
            common: {
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
                write: true,
                desc: "The mower cut border today",
            },
            native: {},
        },
        {
            _id: "startTime",
            type: "state",
            common: {
                name: {
                    en: "Start time",
                    de: "Startzeit",
                    ru: "Начало",
                    pt: "Tempo de início",
                    nl: "Begin de tijd",
                    fr: "Temps de démarrage",
                    it: "Inizio",
                    es: "Hora de inicio",
                    pl: "Od razu",
                    uk: "Час початку",
                    "zh-cn": "启动时间",
                },
                type: "string",
                role: "state",
                read: true,
                write: true,
                desc: "Hour:Minutes on this day that the Landroid should start mowing",
            },
            native: {},
        },
        {
            _id: "workTime",
            type: "state",
            common: {
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
                role: "value.interval",
                unit: "min.",
                read: true,
                write: true,
                desc: "Decides for how long the mower will work on this day",
            },
            native: {},
        },
    ],
    calJson: [
        {
            _id: "calJson",
            type: "state",
            common: {
                name: {
                    en: "Week Json",
                    de: "Woche Json",
                    ru: "Неделя Json",
                    pt: "Rescaldo da Sessão",
                    nl: "Week Json",
                    fr: "Week Json",
                    it: "Settimana Json",
                    es: "Week Json",
                    pl: "Tygodnik",
                    uk: "Тиждень Json",
                    "zh-cn": "周",
                },
                type: "string",
                role: "json",
                read: true,
                write: true,
                desc: "set one time shedule via script with a json",
            },
            native: {},
        },
        {
            _id: "calJson_tosend",
            type: "state",
            common: {
                name: {
                    en: "Week Json",
                    de: "Woche Json",
                    ru: "Неделя Json",
                    pt: "Rescaldo da Sessão",
                    nl: "Week Json",
                    fr: "Week Json",
                    it: "Settimana Json",
                    es: "Week Json",
                    pl: "Tygodnik",
                    uk: "Тиждень Json",
                    "zh-cn": "周",
                },
                type: "string",
                role: "json",
                read: true,
                write: true,
                desc: "set one time shedule via script with a json",
            },
            native: {},
        },
        {
            _id: "calJson_sendto",
            type: "state",
            common: {
                name: {
                    en: "Send Json to Mower",
                    de: "Json nach Mower senden",
                    ru: "Отправить Json в Mower",
                    pt: "Enviar Json para Cortar",
                    nl: "Stuur Json naar Mower",
                    fr: "Envoyer Json à Mower",
                    it: "Invia Json a Mower",
                    es: "Enviar Json a Mower",
                    pl: "Send Json, właśc",
                    uk: "Надіслати Json на косарку",
                    "zh-cn": "Send Json to Mower",
                },
                type: "boolean",
                role: "button",
                read: true,
                write: true,
                def: false,
                desc: "send json",
            },
            native: {},
        },
    ],
    oneTimeShedule: [
        {
            _id: "oneTimeWorkTime",
            type: "state",
            common: {
                name: {
                    en: "Work time in minutes",
                    de: "Arbeitszeit in Minuten",
                    ru: "Время работы за считанные минуты",
                    pt: "Tempo de trabalho em minutos",
                    nl: "Werk over een paar minuten",
                    fr: "Temps de travail en minutes",
                    it: "Tempo di lavoro in pochi minuti",
                    es: "Tiempo de trabajo en minutos",
                    pl: "Czas pracy",
                    uk: "Час роботи за хвилину",
                    "zh-cn": "工作时间",
                },
                type: "number",
                role: "state",
                read: true,
                write: true,
                Unit: "min.",
                desc: "Minutes the mower shoud mow",
            },
            native: {},
        },
        {
            _id: "oneTimeWithBorder",
            type: "state",
            common: {
                name: {
                    en: "With border cut",
                    de: "Mit Randschnitt",
                    ru: "С пограничным вырезом",
                    pt: "Com corte de fronteira",
                    nl: "Met de grens",
                    fr: "Avec la coupe de la frontière",
                    it: "Con taglio di confine",
                    es: "Con corte fronterizo",
                    pl: "Przy granicy wycięto",
                    uk: "З бордюрним вирізом",
                    "zh-cn": "边界减少",
                },
                type: "boolean",
                role: "switch",
                read: true,
                write: true,
                desc: "One time with border",
            },
            native: {},
        },
        {
            _id: "oneTimeStart",
            type: "state",
            common: {
                name: {
                    en: "Start mowing schedule once",
                    de: "Starten Sie den Mähplan einmal",
                    ru: "Начните план шитья раз",
                    pt: "Comece a agendar uma vez",
                    nl: "Begin eens met maaien",
                    fr: "Démarrer le calendrier de l ' amarrage une fois",
                    it: "Avviare il programma di cucito una volta",
                    es: "Empieza el horario de mowing una vez",
                    pl: "Początek harmonogramu",
                    uk: "Почати графік висіву раз",
                    "zh-cn": "一旦启动时间表",
                },
                type: "boolean",
                role: "button",
                read: true,
                write: true,
                desc: "start one time shedule",
                def: false,
            },
            native: {},
        },
        {
            _id: "oneTimeJson",
            type: "state",
            common: {
                name: {
                    en: "One time with Json",
                    de: "Einmal mit Json",
                    ru: "Один раз с Json",
                    pt: "Uma vez com Json",
                    nl: "Een keer met Json",
                    fr: "Une fois avec Json",
                    it: "Una volta con Json",
                    es: "Una vez con Json",
                    pl: "Raz z Jsonem",
                    uk: "Один раз з Json",
                    "zh-cn": "A. 与Json有一天的时间",
                },
                type: "string",
                role: "json",
                read: true,
                write: true,
                Unit: "min.",
                desc: "set one time shedule via script with a json",
            },
            native: {},
        },
    ],
    oneTimeSheduleZone: [
        {
            _id: "oneTimeZones",
            type: "state",
            common: {
                name: {
                    en: "Zones as array",
                    de: "Zonen als Array",
                    ru: "Зоны как массив",
                    pt: "Zonas como array",
                    nl: "Zones als array",
                    fr: "Zones comme tableau",
                    it: "Zone come array",
                    es: "Zonas como matriz",
                    pl: "Strefy jako tablica",
                    uk: "Зони як масив",
                    "zh-cn": "作为数组的区域",
                },
                type: "string",
                role: "json",
                read: true,
                write: true,
                desc: "Select Zone",
            },
            native: {},
        },
    ],
    partyModus: [
        {
            _id: "partyModus",
            type: "state",
            common: {
                name: {
                    en: "Party mode.",
                    de: "Party-Modus.",
                    ru: "Партийный режим.",
                    pt: "Modo de festa.",
                    nl: "Party mode.",
                    fr: "Mode Party.",
                    it: "Modalità partito.",
                    es: "Modo de fiesta.",
                    pl: "Tryb partii.",
                    uk: "Режим партії.",
                    "zh-cn": "缔约方模式。.",
                },
                type: "boolean",
                role: "switch",
                read: true,
                write: true,
                desc: "Disabel mowtimes",
            },
            native: {},
        },
    ],
    paused: [
        {
            _id: "paused",
            type: "state",
            common: {
                name: {
                    en: "Pause mowing plan",
                    de: "Pause Mähplan",
                    ru: "Пауза план швартовки",
                    pt: "Plano de corte Pause",
                    nl: "Pauze maisplan",
                    fr: "Pause mowing plan",
                    it: "Pausa piano di cucito",
                    es: "Plan de simulación de pausa",
                    pl: "Pause mowing plan",
                    uk: "Пауза скошування план",
                    "zh-cn": "口粮计划",
                },
                type: "number",
                role: "state",
                def: 0,
                unit: "Min.",
                read: true,
                write: true,
                desc: "Paused mowtimes",
            },
            native: {},
        },
    ],
    firmware_available: [
        {
            _id: "firmware_available",
            type: "state",
            common: {
                name: {
                    en: "Available firmware",
                    de: "Verfügbare Firmware",
                    ru: "Доступные прошивки",
                    pt: "Firmware disponível",
                    nl: "Availabele firmaware",
                    fr: "Available firmware",
                    it: "Firmware disponibile",
                    es: "Firmware disponible",
                    pl: "Dostępne oprogramowanie",
                    uk: "Доступна прошивка",
                    "zh-cn": "现有的警觉",
                },
                type: "number",
                role: "info.firmware",
                read: true,
                write: false,
                desc: "Available firmware",
            },
            native: {},
        },
        {
            _id: "firmware_available_date",
            type: "state",
            common: {
                name: {
                    en: "Available firmware last update",
                    de: "Letzte Aktualisierung der Firmware",
                    ru: "Доступно последнее обновление прошивки",
                    pt: "Última atualização de firmware disponível",
                    nl: "Availabele firmaware laatste update",
                    fr: "Dernière mise à jour du firmware",
                    it: "Ultimo aggiornamento firmware disponibile",
                    es: "Firmware disponible última actualización",
                    pl: "Dostępny system oprogramowania ostatnia aktualizacja",
                    uk: "Доступні оновлення прошивки",
                    "zh-cn": "最新资料",
                },
                type: "string",
                role: "date",
                read: true,
                write: false,
                desc: "Available firmware last update",
            },
            native: {},
        },
        {
            _id: "firmware_available_all",
            type: "state",
            common: {
                name: {
                    en: "Last available firmware",
                    de: "Letzte verfügbare Firmware",
                    ru: "Последняя доступная прошивка",
                    pt: "Último firmware disponível",
                    nl: "Laatste beschikbare firma",
                    fr: "Dernières disponibilités",
                    it: "Ultimo firmware disponibile",
                    es: "Último firmware disponible",
                    pl: "Oficjalna strona",
                    uk: "Останні доступні прошивки",
                    "zh-cn": "最后一刻可知",
                },
                type: "string",
                role: "json",
                read: true,
                write: false,
                desc: "All Available firmware",
            },
            native: {},
        },
        {
            _id: "firmware_update_start",
            type: "state",
            common: {
                name: {
                    en: "Start update firmware",
                    de: "Aktualisierung der Firmware",
                    ru: "Начать обновление прошивки",
                    pt: "Iniciar firmware de atualização",
                    nl: "Start de update firmaware",
                    fr: "Mettre à jour le firmware",
                    it: "Avviare il firmware di aggiornamento",
                    es: "Inicio firmware de actualización",
                    pl: "Rozpocznij aktualizację oprogramowania układowego",
                    uk: "Початок оновлення прошивки",
                    "zh-cn": "开始更新固件",
                },
                type: "boolean",
                role: "switch",
                read: true,
                write: true,
                desc: "Start update firmware",
                def: false,
            },
            native: {},
        },
        {
            _id: "firmware_update_start_approved",
            type: "state",
            common: {
                name: {
                    en: "Confirm firmware update",
                    de: "Bestätigen Sie Firmware-Update",
                    ru: "Подтвердите обновление прошивки",
                    pt: "Confirme a atualização de firmware",
                    nl: "Bevestig firmaware update",
                    fr: "Confirmez la mise à jour du firmware",
                    it: "Conferma l'aggiornamento del firmware",
                    es: "Confirme la actualización del firmware",
                    pl: "Potwierdzenia oprogramowania",
                    uk: "Підтвердити оновлення мікропрограми",
                    "zh-cn": "肯定软件更新。",
                },
                type: "boolean",
                role: "button",
                read: true,
                write: true,
                desc: "Start update firmware approved",
                def: false,
            },
            native: {},
        },
    ],
    al: [
        {
            _id: "AutoLock",
            type: "state",
            common: {
                name: {
                    en: "automatic locking",
                    de: "automatische Verriegelung",
                    ru: "автоматический замок",
                    pt: "travamento automático",
                    nl: "automatische sloten",
                    fr: "verrouillage automatique",
                    it: "bloccaggio automatico",
                    es: "bloqueo automático",
                    pl: "automatyczne blokowanie",
                    uk: "автоматичне блокування",
                    "zh-cn": "自动锁定",
                },
                type: "boolean",
                role: "switch",
                read: true,
                write: true,
                desc: "AutoLock aus/ein",
            },
            native: {},
        },
        {
            _id: "AutoLockTimer",
            type: "state",
            common: {
                name: {
                    en: "Timer automatic locking",
                    de: "Timer automatische Verriegelung",
                    ru: "Таймер автоматический замок",
                    pt: "Bloqueio automático do temporizador",
                    nl: "Timer automatisch afgesloten",
                    fr: "Verrouillage automatique",
                    it: "Chiusura automatica Timer",
                    es: "Timer bloqueo automático",
                    pl: "Timer automatyczny locking",
                    uk: "Автоматичне блокування таймера",
                    "zh-cn": "时间自动锁定",
                },
                type: "number",
                role: "state",
                unit: "sec",
                read: true,
                write: true,
                min: 0,
                max: 600,
                steps: 1,
                desc: "Time between last key and lock",
            },
            native: {},
        },
    ],
    module_4g: [
        {
            _id: "4G",
            type: "channel",
            common: {
                name: {
                    en: "4G Module",
                    de: "4G Modul",
                    ru: "Модуль 4G",
                    pt: "Módulo 4G",
                    nl: "4G Module",
                    fr: "Module 4G",
                    it: "Modulo 4G",
                    es: "Módulo 4G",
                    pl: "4G Module",
                    uk: "Модуль 4G",
                    "zh-cn": "4G Module",
                },
            },
            native: {},
        },
        {
            _id: "4G.longitude",
            type: "state",
            common: {
                name: {
                    en: "Longitude",
                    de: "Längengrad",
                    ru: "Долгота",
                    pt: "Longitude",
                    nl: "Longit",
                    fr: "Longitude",
                    it: "Longitudine",
                    es: "Longitud",
                    pl: "Długość",
                    uk: "Довгий",
                    "zh-cn": "长 度",
                },
                type: "number",
                role: "value.gps.longitude",
                read: true,
                write: false,
                desc: "longitude position",
            },
            native: {},
        },
        {
            _id: "4G.latitude",
            type: "state",
            common: {
                name: {
                    en: "latitude",
                    de: "Breitengrad",
                    ru: "широта",
                    pt: "latitude",
                    nl: "breedtegraad",
                    fr: "latitude",
                    it: "latitudine",
                    es: "latitud",
                    pl: "szerokości geograficznej",
                    uk: "знаменитості",
                    "zh-cn": "纬度",
                },
                type: "number",
                role: "value.gps.latitude",
                read: true,
                write: false,
                desc: "longitude position",
            },
            native: {},
        },
    ],
    module_ea: [
        {
            _id: "EA",
            type: "channel",
            common: {
                name: {
                    en: "electric height adjustment",
                    de: "elektrische Höhenverstellung",
                    ru: "электрическая регулировка высоты",
                    pt: "ajuste de altura elétrica",
                    nl: "elektrische hoogteinstelling",
                    fr: "réglage de la hauteur électrique",
                    it: "regolazione altezza elettrica",
                    es: "ajuste de la altura eléctrica",
                    pl: "regulacja wysokości elektrycznej",
                    uk: "регулювання висоти електричної енергії",
                    "zh-cn": "电动高度调整",
                },
            },
            native: {},
        },
        {
            _id: "EA.h",
            type: "state",
            common: {
                name: {
                    en: "height setting",
                    de: "Höheneinstellung",
                    ru: "настройка высоты",
                    pt: "definição de altura",
                    nl: "hoogte instelling",
                    fr: "réglage de la hauteur",
                    it: "regolazione altezza",
                    es: "ajuste de altura",
                    pl: "ustawienie wysokości",
                    uk: "регулювання висоти",
                    "zh-cn": "高度设置",
                },
                type: "number",
                role: "value",
                read: true,
                write: true,
                unit: "mm",
                def: 0,
                desc: "electric height adjustment",
            },
            native: {},
        },
    ],
    module_df: [
        {
            _id: "DF",
            type: "channel",
            common: {
                name: {
                    en: "Offlimit Module",
                    de: "Offlimit Modul",
                    ru: "Offlimit Модуль",
                    pt: "Módulo de distribuição",
                    nl: "Offlim Module",
                    fr: "Module de délimitation",
                    it: "Modulo off-limit",
                    es: "Módulo de límites",
                    pl: "Oficjalna strona",
                    uk: "Модуль Offlimit",
                    "zh-cn": "限制",
                },
            },
            native: {},
        },
        {
            _id: "DF.OLMSwitch_Cutting",
            type: "state",
            common: {
                name: {
                    en: "detect magnetic stripes",
                    de: "magnetische Streifen erfassen",
                    ru: "обнаружить магнитные полоски",
                    pt: "detectar listras magnéticas",
                    nl: "magnetische strepen",
                    fr: "détecter les bandes magnétiques",
                    it: "rilevare strisce magnetiche",
                    es: "detectar tiras magnéticas",
                    pl: "detektor magnetyczny",
                    uk: "виявлення магнітних смуг",
                    "zh-cn": "发现磁带",
                },
                type: "boolean",
                role: "switch",
                read: true,
                write: true,
                desc: "if active mower turn when hit magnet stripe while cutting",
            },
            native: {},
        },
        {
            _id: "DF.OLMSwitch_FastHoming",
            type: "state",
            common: {
                name: {
                    en: "fast to home.",
                    de: "schnell nach Hause.",
                    ru: "быстро до дома.",
                    pt: "rápido para casa.",
                    nl: "snel naar huis.",
                    fr: "vite à la maison.",
                    it: "veloce a casa.",
                    es: "rápido a casa.",
                    pl: "szybko do domu.",
                    uk: "швидко в домашніх умовах.",
                    "zh-cn": "住房快。.",
                },
                type: "boolean",
                role: "switch",
                read: true,
                write: true,
                desc: "if active mower turn when hit magnet stripe while driving home",
            },
            native: {},
        },
    ],
    module_tq: [
        {
            _id: "torque",
            type: "state",
            common: {
                name: {
                    en: "Wheel torque",
                    de: "Raddrehmoment",
                    ru: "Колесо torque",
                    pt: "Torno de roda",
                    nl: "Wheel torque",
                    fr: "Couple de roue",
                    it: "Coppia ruote",
                    es: "Arque de rueda",
                    pl: "Wheel torque",
                    uk: "Колісний крутний момент",
                    "zh-cn": "Wheel torque",
                },
                type: "number",
                role: "state",
                read: true,
                write: true,
                min: -50,
                max: 50,
                steps: 1,
                desc: "torque control",
            },
            native: {},
        },
    ],
    US: [
        {
            _id: "US",
            type: "channel",
            common: {
                name: {
                    en: "ACS Module",
                    de: "ACS Modul",
                    ru: "Модуль ACS",
                    pt: "Módulo ACS",
                    nl: "ACS Module",
                    fr: "Module ACS",
                    it: "Modulo ACS",
                    es: "Módulo ACS",
                    pl: "ACS Module",
                    uk: "Модуль змінного струму",
                    "zh-cn": "ACS Module",
                },
            },
            native: {},
        },
        {
            _id: "US.ACS",
            type: "state",
            common: {
                name: {
                    en: "ACS Module",
                    de: "ACS Modul",
                    ru: "Модуль ACS",
                    pt: "Módulo ACS",
                    nl: "ACS Module",
                    fr: "Module ACS",
                    it: "Modulo ACS",
                    es: "Módulo ACS",
                    pl: "ACS Module",
                    uk: "Модуль змінного струму",
                    "zh-cn": "ACS Module",
                },
                type: "number",
                role: "state",
                read: true,
                write: true,
                desc: "ACS Module",
                states: {
                    0: "disabled",
                    1: "enabled",
                },
            },
            native: {},
        },
        {
            _id: "US.ACS_Status",
            type: "state",
            common: {
                name: {
                    en: "Status ACS Module",
                    de: "Status ACS Modul",
                    ru: "Статус ACS Модуль",
                    pt: "Estado ACS Módulo",
                    nl: "Status ACS Module",
                    fr: "Statut ACS Module",
                    it: "Stato ACS Modulo",
                    es: "Status ACS Módulo",
                    pl: "Status ACS Module",
                    uk: "Статус на сервери Модуль",
                    "zh-cn": "现状 导 言",
                },
                type: "string",
                role: "value",
                read: true,
                write: false,
                desc: "ACS Module Status",
            },
            native: {},
        },
    ],
    HL: [
        {
            _id: "HL",
            type: "channel",
            common: {
                name: {
                    en: "HL Module",
                    de: "HL Modul",
                    ru: "HL модуль",
                    pt: "Módulo HL",
                    nl: "HL Module",
                    fr: "Module HL",
                    it: "Modulo HL",
                    es: "Módulo HL",
                    pl: "HL Module",
                    uk: "Модуль HL",
                    "zh-cn": "HL Module",
                },
            },
            native: {},
        },
        {
            _id: "HL.hl",
            type: "state",
            common: {
                name: {
                    en: "HL Module",
                    de: "HL Modul",
                    ru: "HL модуль",
                    pt: "Módulo HL",
                    nl: "HL Module",
                    fr: "Module HL",
                    it: "Modulo HL",
                    es: "Módulo HL",
                    pl: "HL Module",
                    uk: "Модуль HL",
                    "zh-cn": "HL Module",
                },
                type: "number",
                role: "state",
                read: true,
                write: true,
                desc: "HL Module",
                states: {
                    0: "disabled",
                    1: "enabled",
                },
            },
            native: {},
        },
        {
            _id: "HL.HL_Status",
            type: "state",
            common: {
                name: {
                    en: "Status HL Module",
                    de: "Status HL Modul",
                    ru: "Статус HL Module",
                    pt: "Módulo HL de status",
                    nl: "Status HL Module",
                    fr: "Module HL de statut",
                    it: "Modulo HL di stato",
                    es: "Módulo HL de estado",
                    pl: "Status HL Module",
                    uk: "Статус HL Модуль",
                    "zh-cn": "现状HL Module。",
                },
                type: "string",
                role: "value",
                read: true,
                write: false,
                desc: "HL Module Status",
            },
            native: {},
        },
    ],
    weekname: [
        {
            en: "Sunday",
            de: "Sonntag",
            ru: "Воскресенье",
            pt: "Domingo",
            nl: "Zondag",
            fr: "Dimanche",
            it: "Domenica",
            es: "Domingo",
            pl: "Niedziela",
            uk: "Неділя",
            "zh-cn": "星期日",
        },
        {
            en: "Monday",
            de: "Montag",
            ru: "Понедельник",
            pt: "Segunda-feira",
            nl: "Maandag",
            fr: "Lundi",
            it: "Lunedì",
            es: "Lunes",
            pl: "Monday",
            uk: "Понеділок",
            "zh-cn": "星期一",
        },
        {
            en: "Tuesday",
            de: "Dienstag",
            ru: "Вторник",
            pt: "Terça-feira",
            nl: "Dinsdag",
            fr: "Mardi",
            it: "Martedì",
            es: "Martes",
            pl: "Tuesday",
            uk: "Вівторок",
            "zh-cn": "星期二",
        },
        {
            en: "Wednesday",
            de: "Mittwoch",
            ru: "Среда",
            pt: "Quarta-feira",
            nl: "Woensdag",
            fr: "Mercredi",
            it: "Mercoledì",
            es: "Miércoles",
            pl: "Środa",
            uk: "Середа",
            "zh-cn": "星期三",
        },
        {
            en: "Thursday",
            de: "Donnerstag",
            ru: "Четверг",
            pt: "Quinta-feira",
            nl: "Donderdag",
            fr: "Jeudi",
            it: "Giovedì",
            es: "Jueves",
            pl: "Thursday",
            uk: "Четвер",
            "zh-cn": "星期四",
        },
        {
            en: "Friday",
            de: "Freitag",
            ru: "Пятница",
            pt: "Sexta-feira",
            nl: "Vrijdag",
            fr: "Vendredi",
            it: "Venerdì",
            es: "Viernes",
            pl: "Piątek",
            uk: "П'ятниця",
            "zh-cn": "星期五",
        },
        {
            en: "Saturday",
            de: "Samstag",
            ru: "Суббота",
            pt: "Sábado",
            nl: "Zaterdag",
            fr: "Samedi",
            it: "Sabato",
            es: "Sábado",
            pl: "Sobota",
            uk: "Субота",
            "zh-cn": "星期六",
        },
    ],
    weekname2: [
        {
            en: "Sunday 2",
            de: "Sonntag 2",
            ru: "Воскресенье 2",
            pt: "Domingo 2",
            nl: "Zondag 2",
            fr: "Dimanche 2",
            it: "Domenica 2",
            es: "Domingo 2",
            pl: "Niedziela 2",
            uk: "Неділя 2",
            "zh-cn": "星期日 2",
        },
        {
            en: "Monday 2",
            de: "Montag 2",
            ru: "Понедельник 2",
            pt: "Segunda-feira 2",
            nl: "Maandag 2",
            fr: "Lundi 2",
            it: "Lunedì 2",
            es: "Lunes 2",
            pl: "Monday 2",
            uk: "Понеділок 2",
            "zh-cn": "星期一 2",
        },
        {
            en: "Tuesday 2",
            de: "Dienstag 2",
            ru: "Вторник 2",
            pt: "Terça-feira 2",
            nl: "Dinsdag 2",
            fr: "Mardi 2",
            it: "Martedì 2",
            es: "Martes 2",
            pl: "Tuesday 2",
            uk: "Вівторок 2",
            "zh-cn": "星期二 2",
        },
        {
            en: "Wednesday 2",
            de: "Mittwoch 2",
            ru: "Среда 2",
            pt: "Quarta-feira 2",
            nl: "Woensdag 2",
            fr: "Mercredi 2",
            it: "Mercoledì 2",
            es: "Miércoles 2",
            pl: "Środa 2",
            uk: "Середа 2",
            "zh-cn": "星期三 2",
        },
        {
            en: "Thursday 2",
            de: "Donnerstag 2",
            ru: "Четверг 2",
            pt: "Quinta-feira 2",
            nl: "Donderdag 2",
            fr: "Jeudi 2",
            it: "Giovedì 2",
            es: "Jueves 2",
            pl: "Thursday 2",
            uk: "Четвер 2",
            "zh-cn": "星期四 2",
        },
        {
            en: "Friday 2",
            de: "Freitag 2",
            ru: "Пятница 2",
            pt: "Sexta-feira 2",
            nl: "Vrijdag 2",
            fr: "Vendredi 2",
            it: "Venerdì 2",
            es: "Viernes 2",
            pl: "Piątek 2",
            uk: "П'ятниця 2",
            "zh-cn": "星期五 2",
        },
        {
            en: "Saturday 2",
            de: "Samstag 2",
            ru: "Суббота 2",
            pt: "Sábado 2",
            nl: "Zaterdag 2",
            fr: "Samedi 2",
            it: "Sabato 2",
            es: "Sábado 2",
            pl: "Sobota 2",
            uk: "Субота 2",
            "zh-cn": "星期六 2",
        },
    ],
};
