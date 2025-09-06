
async function postRequest(url, headers, body, files) {
    if (!files) {
        console.log(url);
        console.log(headers);
        console.log(body);

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        console.log(response);

        if (!response.ok) {
            return [undefined, response.status];
        }

        return [await response.json(), response.status];
    }

    const formData = new FormData();
    for (const [key, value] of Object.entries(JSON.parse(body))) {
        formData.append(key, value);
    }
    files.forEach(file => {
        formData.append('file', new Blob([file.buffer]), file.originalname);
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: formData
    });

    return [await response.json(), response.status];
}
