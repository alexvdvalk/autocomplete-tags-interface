import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'autocomplete-tags',
	name: 'Autocomplete Tags (API)',
	icon: 'local_offer',
	description: 'Search and select multiple items as tags from an external API',
	component: InterfaceComponent,
	options: () => {
		return [
			{
				field: 'url',
				name: 'API URL',
				type: 'string',
				meta: {
					interface: 'input',
					width: 'full',
					options: {
						placeholder: 'https://api.example.com/search?q={{value}}',
						font: 'monospace',
					},
					note: 'API endpoint URL. Use {{value}} as placeholder for the search query.',
				},
			},
			{
				field: 'resultsPath',
				name: 'Results Path',
				type: 'string',
				meta: {
					interface: 'input',
					width: 'half',
					options: {
						placeholder: 'data.results',
						font: 'monospace',
					},
					note: 'Path to results array in API response (e.g., "data.results" or "items"). Leave empty if response is an array.',
				},
			},
			{
				field: 'textPath',
				name: 'Text Path',
				type: 'string',
				meta: {
					interface: 'input',
					width: 'half',
					options: {
						placeholder: 'name',
						font: 'monospace',
					},
					note: 'Path to display text in each result item (e.g., "name" or "title").',
				},
				schema: {
					default_value: 'name',
				},
			},
			{
				field: 'valuePath',
				name: 'Value Path',
				type: 'string',
				meta: {
					interface: 'input',
					width: 'half',
					options: {
						placeholder: 'id',
						font: 'monospace',
					},
					note: 'Path to value in each result item (e.g., "id" or "slug"). Defaults to text path.',
				},
			},
			{
				field: 'trigger',
				name: 'Trigger',
				type: 'string',
				meta: {
					interface: 'select-dropdown',
					width: 'half',
					options: {
						choices: [
							{ text: 'Throttle', value: 'throttle' },
							{ text: 'Debounce', value: 'debounce' },
						],
					},
					note: 'When to trigger API requests.',
				},
				schema: {
					default_value: 'debounce',
				},
			},
			{
				field: 'rate',
				name: 'Rate (ms)',
				type: 'integer',
				meta: {
					interface: 'input',
					width: 'half',
					note: 'Milliseconds to wait before triggering request.',
				},
				schema: {
					default_value: 500,
				},
			},
			{
				field: 'placeholder',
				name: 'Placeholder',
				type: 'string',
				meta: {
					interface: 'input',
					width: 'half',
					options: {
						placeholder: 'Type to search...',
					},
				},
			},
			{
				field: 'iconLeft',
				name: 'Icon Left',
				type: 'string',
				meta: {
					interface: 'select-icon',
					width: 'half',
				},
			},
			{
				field: 'iconRight',
				name: 'Icon Right',
				type: 'string',
				meta: {
					interface: 'select-icon',
					width: 'half',
				},
			},
			{
				field: 'allowCustom',
				name: 'Allow Custom Tags',
				type: 'boolean',
				meta: {
					interface: 'boolean',
					width: 'half',
					note: 'Allow adding custom tags that don\'t exist in the API results',
				},
				schema: {
					default_value: false,
				},
			},
		];
	},
	types: ['json'],
});
