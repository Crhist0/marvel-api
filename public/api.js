const api = axios.create({
    baseURL: "https://api-growdevers-crhist0.herokuapp.com/",
});

api.get("/")
    .then((result) => {
        console.log(result.data);
        for (const user of result.data.data) {
            document.getElementById("lista").innerHTML += `
            <li>${user.nome} - ${user.turma}</li>            
            `;
        }
    })
    .catch((err) => {
        console.log("erro?");
    });
