//v3.0
const alreadyCreatedObjects = {};
async function extractKeys(adapter, path, element, preferedArrayName, forceIndex, write, channelName) {
    try {
        if (element === null || element === undefined) {
            adapter.log.debug(`Cannot extract empty: ${path}`);
            return;
        }

        const objectKeys = Object.keys(element);

        if (!write) {
            write = false;
        }

        if (typeof element === 'string' || typeof element === 'number') {
            let name = element;
            if (typeof element === 'number') {
                name = element.toString();
            }
            if (!alreadyCreatedObjects[path]) {
                try {
                    await adapter
                        .setObjectNotExistsAsync(path, {
                            type: 'state',
                            common: {
                                name: name,
                                role: getRole(element, write),
                                type: typeof element || 'mixed',
                                write: write,
                                read: true,
                            },
                            native: {},
                        });
                    alreadyCreatedObjects[path] = true;
                } catch (error) {
                    adapter.log.error(error);
                }
            }
            if (element) {
                adapter.setState(path, element, true);
            }
            return;
        }
        if (!alreadyCreatedObjects[path]) {
            try {
                await adapter
                    .setObjectNotExistsAsync(path, {
                        type: 'channel',
                        common: {
                            name: channelName || '',
                            write: false,
                            read: true,
                        },
                        native: {},
                    });
                alreadyCreatedObjects[path] = true;
            } catch (error) {
                adapter.log.error(error);
            }
        }
        if (Array.isArray(element)) {
            await extractArray(adapter, element, '', path, write, preferedArrayName, forceIndex);
            return;
        }
        for (const key of objectKeys) {
            if (Array.isArray(element[key])) {
                await extractArray(adapter, element, key, path, write, preferedArrayName, forceIndex);
            } else if (element[key] !== null && typeof element[key] === 'object') {
                await extractKeys(adapter, `${path}.${key}`, element[key], preferedArrayName, forceIndex, write);
            } else {
                if (!alreadyCreatedObjects[`${path}.${key}`]) {
                    try {
                        await adapter
                            .setObjectNotExistsAsync(`${path}.${key}`, {
                                type: 'state',
                                common: {
                                    name: key,
                                    role: getRole(element[key], write),
                                    type: typeof element[key] || 'mixed',
                                    write: write,
                                    read: true,
                                },
                                native: {},
                            });
                        alreadyCreatedObjects[`${path}.${key}`] = true;
                    } catch (error) {
                        adapter.log.error(error);
                    }
                }
                if (element[key]) {
                    adapter.setState(`${path}.${key}`, element[key], true);
                }
            }
        }
    } catch (error) {
        adapter.log.error(`Error extract keys: ${path} ${JSON.stringify(element)}`);
        adapter.log.error(error);
    }
}
async function extractArray(adapter, element, key, path, write, preferedArrayName, forceIndex) {
    try {
        if (key) {
            element = element[key];
        }
        for (let index in element) {
            const arrayElement = element[index];
            index = index + 1;
            if (index < 10) {
                index = `0${index}`;
            }
            let arrayPath = key + index;
            if (typeof arrayElement === 'string') {
                await extractKeys(adapter, `${path}.${key}.${arrayElement}`, arrayElement, preferedArrayName, forceIndex, write);
                continue;
            }
            if (!arrayElement && typeof arrayElement === 'object') {
                adapter.log.debug(`Cannot extract empty: ${path}.${key}.${index} from ${JSON.stringify(element)}`);
                return;
            }
            if (typeof arrayElement[Object.keys(arrayElement)[0]] === 'string') {
                arrayPath = arrayElement[Object.keys(arrayElement)[0]];
            }
            Object.keys(arrayElement).forEach((keyName) => {
                if (keyName.endsWith('Id') && arrayElement[keyName] !== null) {
                    if (arrayElement[keyName] && arrayElement[keyName].replace) {
                        arrayPath = arrayElement[keyName].replace(/\./g, '');
                    } else {
                        arrayPath = arrayElement[keyName];
                    }
                }
            });
            Object.keys(arrayElement).forEach((keyName) => {
                if (keyName.endsWith('Name')) {
                    arrayPath = arrayElement[keyName];
                }
            });

            if (arrayElement.id) {
                if (arrayElement.id.replace) {
                    arrayPath = arrayElement.id.replace(/\./g, '');
                } else {
                    arrayPath = arrayElement.id;
                }
            }
            if (arrayElement.name) {
                arrayPath = arrayElement.name.replace(/\./g, '');
            }
            if (arrayElement.start_date_time) {
                arrayPath = arrayElement.start_date_time.replace(/\./g, '');
            }
            if (preferedArrayName && arrayElement[preferedArrayName]) {
                arrayPath = arrayElement[preferedArrayName].replace(/\./g, '');
            }

            if (forceIndex) {
                arrayPath = key + index;
            }
            //special case array with 2 string objects
            if (
                Object.keys(arrayElement).length === 2 &&
                typeof Object.keys(arrayElement)[0] === 'string' &&
                typeof Object.keys(arrayElement)[1] === 'string' &&
                typeof arrayElement[Object.keys(arrayElement)[0]] !== 'object' &&
                typeof arrayElement[Object.keys(arrayElement)[1]] !== 'object' &&
                arrayElement[Object.keys(arrayElement)[0]] !== 'null'
            ) {
                let subKey = arrayElement[Object.keys(arrayElement)[0]];
                const subValue = arrayElement[Object.keys(arrayElement)[1]];
                const subName = `${Object.keys(arrayElement)[0]} ${Object.keys(arrayElement)[1]}`;
                if (key) {
                    subKey = `${key}.${subKey}`;
                }
                if (!alreadyCreatedObjects[`${path}.${subKey}`]) {
                    try {
                        await adapter
                            .setObjectNotExistsAsync(`${path}.${subKey}`, {
                                type: 'state',
                                common: {
                                    name: subName,
                                    role: getRole(subValue, write),
                                    type: typeof subValue || 'mixed',
                                    write: write,
                                    read: true,
                                },
                                native: {},
                            })
                        alreadyCreatedObjects[`${path}.${subKey}`] = true;
                    } catch (error) {
                        adapter.log.error(error);
                    }
                }
                if (subValue) {
                    adapter.setState(`${path}.${subKey}`, subValue, true);
                }
                continue;
            }
            await extractKeys(adapter, `${path}.${arrayPath}`, arrayElement, preferedArrayName, forceIndex, write);
        }
    } catch (error) {
        adapter.log.error(`Cannot extract array ${path}`);
        adapter.log.error(error);
    }
}

function getRole(element, write) {
    if (typeof element === 'boolean' && !write) {
        return 'indicator';
    }
    if (typeof element === 'boolean' && write) {
        return 'switch';
    }
    if (typeof element === 'number' && !write) {
        return 'value';
    }
    if (typeof element === 'number' && write) {
        return 'level';
    }
    if (typeof element === 'string') {
        return 'text';
    }
    return 'state';
}

module.exports = {
    extractKeys,
};
