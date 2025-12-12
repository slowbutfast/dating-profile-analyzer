import { createContext, useContext, ReactNode } from 'react';

interface MockAnalysisData {
  analysis: any;
  textResponses: any[];
  textFeedback: Record<string, any>;
  photos: any[];
  imageAnalysisPhotos: any[];
}

interface MockDataContextType {
  mockData?: MockAnalysisData;
}

const MockDataContext = createContext<MockDataContextType>({});

export function MockDataProvider({
  children,
  mockData,
}: {
  children: ReactNode;
  mockData?: MockAnalysisData;
}) {
  return (
    <MockDataContext.Provider value={{ mockData }}>
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockData() {
  return useContext(MockDataContext);
}
