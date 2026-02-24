import React from 'react';
import { Box, Text } from 'ink';
import type { ReactNode } from 'react';

interface ModalProps {
	children?: ReactNode;
	title?: string;
}

export const Modal = ({ children, title }: ModalProps) => (
	<Box flexDirection="column">
		<Text>MOCK MODAL: {title}</Text>
		{children}
	</Box>
);
