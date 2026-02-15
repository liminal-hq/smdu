import React from 'react';
import { Box, Text } from 'ink';

export const Modal = ({ children, title }: any) => (
	<Box flexDirection="column">
		<Text>MOCK MODAL: {title}</Text>
		{children}
	</Box>
);
