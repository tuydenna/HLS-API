function getProcessArgsObj<T>(argv: string[]) {
    const args = argv.slice(2);
    const parsed: Partial<T> = {};
    args.forEach(arg => {
        const [key, value] = arg.split('=');
        parsed[key.replace(/^--/, '')] = value;
    });
    return parsed;
}

export {getProcessArgsObj}