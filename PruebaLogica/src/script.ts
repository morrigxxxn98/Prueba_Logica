
import * as fs from 'fs';
import path from 'path';

/**
 * Clase utilizada para tipar el resultado de las ciudades en la lectura de los datos del archivo csv para evitar el uso de variables
 * de tipo any en el casteo de datos
 */
class CsvObjectState{
    UID!: number;
    iso2!: string
	iso3!: string
    code3!: number;
    FIPS!: number;
    Admin2!: string
    Province_State!: string
    Country_Region!: string
    Lat!: number
    Long_!: number;
    Combined_Key!: string
    Population!: number;
    dates: Array<KeyValueDate> = [];
}

/**
 * Clase utilizada para tipar las columnas en forma de objeto de las fechas establecidas en cada ciudad de cada estado.
 */
class KeyValueDate {
    fecha!: Date;
    value!: number;
}

/**
 * Clase utilizada para tipar cada estado teniendo en cuenta sus respectivas ciudades y la cantidad de ciudades correspondientes
 * a cada estado.
 */
class KeyValueState{
    state!: string;
    cities: Array<CsvObjectState> = [];
    amount_cities!: number;
}

/**
 * Clase utilizada para tipar el resultado de los analisis de los datos respecto a las preguntas de la prueba.
 */
class StateObjectAnalized {
    state!: string;
    accumulated_deaths!: number;
    total_population!:number;
    mortality!:string;
}

/**
 * Funcion asyncrona encargada de obtener y leer el archivo csv. 
 */
async function readFile(){

    console.log('Presentado por Juan David Ojeda Bernal\n');
    const csvFilePath = path.resolve(__dirname, 'files/time_series_covid19_deaths_US.csv');
    try {
        const data = await fs.readFileSync(csvFilePath, 'utf8');
        csvToArray(data);
      } catch (err) {
        console.error(err)
      }
}

/**
 * Funcion encargada de convertir la lectura de un archivo csv a un array de objetos 
 * mediante el uso del metodo String.split() para separar cada columna y valor de la
 * columna en cada fila teniendo en cuenta que no todas las comillas deben ser tenidas
 * en cuenta para poder separar los datos, en este caso hay columnas utilizando comillas con comas
 * embebidas, por ende el string debe quedar intacto para la columna Combined_Key.
 * Además se realiza la organizacion de los datos de tipo Date tipandolos y anexandolos 
 * a cada ciudad como un array clave valor (fecha, cantidad)
 * Recibe como parametro el archivo leido en formato string.
 * @param csv 
 */
function csvToArray(csv : string){
    var lineBreaks = csv.split("\r\n");
    var arrayResult:Array<CsvObjectState> = [];

    var headerCsv = lineBreaks[0].split(",");

    for(let i = 0; i < lineBreaks.length; i++){
        var object:CsvObjectState = new CsvObjectState();
        var currentLineBreak:any = [];
            currentLineBreak = lineBreaks[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
       
        for(let j = 0; j < headerCsv.length; j++){

            object.UID = currentLineBreak[0];
            object.iso2 = currentLineBreak[1];
            object.iso3 = currentLineBreak[2];
            object.code3 = currentLineBreak[3];
            object.FIPS = currentLineBreak[4];
            object.Admin2 = currentLineBreak[5];
            object.Province_State = currentLineBreak[6];
            object.Country_Region = currentLineBreak[7];
            object.Lat = currentLineBreak[8];
            object.Long_ = currentLineBreak[9];
            object.Combined_Key = currentLineBreak[10];
            object.Population = parseInt(currentLineBreak[11]);

            if(j >= 12){
                const obj = new KeyValueDate();
                obj.fecha = new Date(headerCsv[j]);
                obj.value = parseInt(currentLineBreak[j]);

                object.dates.push(obj);
            }
        }

        arrayResult.push(object); 
    }

    groupByStates(arrayResult);
}

/**
 * Funcion encargada de agrupar las ciudades por estado, es decir, en el array de objetos que se ha de generar
 * se guardará como un objeto cada estado con su respectivo nombre, el listado de ciudades que tiene y la cantidad de
 * ciudades que posee.
 * Recibe como parametro csvResult: Array de ciudades sin agrupar por estado.
 * @param csvResult 
 */
function groupByStates(csvResult: Array<CsvObjectState>){

    var arrHeaders = [];
    for(let i = 1; i < csvResult.length; i++){
            if(csvResult[i - 1].Province_State == csvResult[i].Province_State){
                if(arrHeaders.includes(csvResult[i].Province_State) === false){
                    arrHeaders.push(csvResult[i].Province_State);
                }
            }
    }

    var finalArrayKeyValue: Array<KeyValueState> = [];
    arrHeaders.forEach((p) => {
        const arr = csvResult.filter(f => f.Province_State == p);
        const obj2 = new KeyValueState();
        obj2.state = p;
        obj2.cities = arr;
        obj2.amount_cities = arr.length;
        finalArrayKeyValue.push(obj2);  
    });

    console.log('\r\nEstados agrupados')
    console.table(finalArrayKeyValue);
    groupValueStates(finalArrayKeyValue);
}


/**
 * Función encargada de analizar el array finalmente agrupado por estados en el que 
 * para cada ciudad se realiza la suma del acumulado de muertes y finalmente se suman todas
 * para obtener la cantidad final por estado, lo mismo se realiza para la suma de la cantidad de habitantes
 * de todas las ciudades de dicho estado.
 * Recibe como parametro el Array filtrado por estados.
 * @param finalArray 
 */

function groupValueStates(finalArray: Array<KeyValueState>){

    const mutatedArray : Array<StateObjectAnalized> = [];
    finalArray.forEach((i) => {
        const obj = new StateObjectAnalized();
        let _accumulated_deaths = 0;
        let _total_population = 0;
        i.cities.forEach((j) => {
            _accumulated_deaths += j.dates[j.dates.length - 1].value;
            _total_population += j.Population;
        });

        obj.state = i.state;
        obj.accumulated_deaths = _accumulated_deaths;
        obj.total_population = _total_population;
        obj.mortality = ((obj.accumulated_deaths / obj.total_population) * 100).toFixed(2);
        mutatedArray.push(obj);
    });

    getAnalizedAnswers(mutatedArray);
}

/**
 * Funcion encargada de obtener el analisis de las puntos planteados en la prueba, en este caso el estado
 * con mayor acumulado hasta la fecha, con menor acumulado hasta la fecha, el porcentaje de muertes y el mas afectado hasta la fecha.
 * Recibe como parametro el Array transformado en la funcion anterior para manejar mas fácil los datos.
 * @param mutatedArray 
 */
function getAnalizedAnswers(mutatedArray: Array<StateObjectAnalized>){
        const max = mutatedArray.reduce((max, obj) => { return max.total_population > obj.total_population ? max:obj});
        const min = mutatedArray.reduce((min, obj) => { return min.total_population < obj.total_population ? min:obj});
        const def = mutatedArray.reduce((max, obj) => { return max.mortality > obj.mortality? max:obj});
        
        

        console.log('\r\n respuesta 3: Porcentaje de muertes vs total poblacion por estado')
        console.table(mutatedArray.map((p) => {
            p.mortality = `${p.mortality} %`;
            return p;
        }));

        console.log('\r\nRespuestas 1, 2 y 4')
        console.table({'1. Estado con mayor acumulado': max, '2. Estado con menor acumulado': min, '4. El estado mas afectado %':def});

        console.log(`\r\n¿Porqué ${def.state} es el mas afectado?`);

        const respuesta = `\r\nTeniendo en cuenta que la población total de cada estado finalmente es la que define la magnitud de la mortalidad`+
                           ` en una población, se puede afirmar que el porcentaje de muertes por estado es el que precisa el impacto de los decesos por COVID,`+
                           ` en este caso, el estado de ${def.state} representa el porcentaje más alto de un ${def.mortality} frente `+
                           ` a los otros estados puesto que la mortalidad es mayormente significativa respecto al total de la problación del estado, donde se puede concluir `+
                           ` que la cantidad de muertes impacta más a un estado cuando sus indices se aproximan a una gran parte de su población total.\r\n`;
        console.log(respuesta);
}

readFile();