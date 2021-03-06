import {useEffect, useState} from 'react';
import {graphqlServer} from './servers';
const fetch = window.fetch || require('node-fetch');

const recordKey = 'playgroundRecord';

export function constructDataInsertion(identity: string, data: string): string {
	return `https://${graphqlServer}:4000/graphql?query={addData(identityId:"${identity}",data:"${data}")}`;
}

export function constructGetData(identity: string){
	return `https://${graphqlServer}:4000/graphql?query={getData(identityId:"${identity}"){${recordKey}}}`;
}

function constructQuery(methodName: string, identity: string): string {
	return `https://${graphqlServer}:4000/graphql?query={${methodName}(identityId:"${identity}")}`;
}

export function useGetIpfsData(identityId: string, label: string, updateIndex: number): string[]{
	const [result, setResult] = useState<string[]>([]);
	useEffect(()=>{
		const fetchData = async ()=>{
			const queryUrl = constructGetData(identityId);
			try {
				const response = await fetch(queryUrl, {mode: 'cors'});
				const json = await response.json();
				const resultList = json.data.getData;
				const processedList = resultList.reduce((acc: string[], recordItem: any) => {
					if(recordItem.hasOwnProperty(recordKey) && recordItem[recordKey].indexOf(`${label}:`)!==-1){
						const recordContent = recordItem[recordKey].substring(label.length+1);
						acc.push(recordContent);
					}
					return acc;
				},[]);
				setResult(processedList);
			} catch(e){
				console.log('get data error:' + e.toString());
			}
		}
		fetchData();
	}, [identityId, label, updateIndex])
	return result;
}

export async function getIpfsAddress(identity: string): Promise<string | null> {
	const maximalQuery = 5;
	let query = 0;
	let result = null;
	const queryUrl = constructQuery('determineAddress', identity);
	while (query < maximalQuery) {
		try {
			const response = await fetch(queryUrl, {mode: 'cors'});
			const json = await response.json();
			const fetchedData = json.data.determineAddress;
			if (fetchedData.indexOf('/orbitdb') !== -1) {
				result = fetchedData;
				break;
			} else {
				query++;
			}
		} catch (error) {
			console.error(error);
		}
	}
	return result;
}
