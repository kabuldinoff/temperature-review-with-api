import React, { useState, useEffect } from "react";
import { ThemeProvider, Container, Row, Col, Table, Form, Button } from "react-bootstrap";
import { LineChart, XAxis, YAxis, CartesianGrid, Line, Tooltip } from "recharts";
import "./StyleExtension.css";
import {  addDays, subDays, format } from "date-fns";

// Interface for the data type
interface Data {
    YYYYMMDD: number;
    Temperature: number;
}

// Component that renders the data as table and graph
const TemperatureReview: React.FC = () => {
    const [numDays, setNumDays] = useState<number>(50); // Set 50 days as default
    const [dailyAverages, setDailyAverages] = useState<Data[]>([]); // Use state to store the daily average temperatures
    const [searchTerm, setSearchTerm] = useState<string>(""); // Store the search term
    const [sortOrder, setSortOrder] = useState<string>("asc"); // Store the sort order

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchData = async (date: Date): Promise<Data[]> => {
        const formattedDate = format(date, "yyyy-MM-dd"); // Format as in Bright Sky API
        const response = await fetch(`https://api.brightsky.dev/weather?lat=51.13&lon=13.75&date=${formattedDate}`); // Dresden coordinates
        const jsonData = await response.json();
        const dailyTemperatures = jsonData.weather.map((item: any) => item.temperature);
        const avgTemp = dailyTemperatures.reduce((accumulator: number, currentValue: number) => accumulator + currentValue, 0) / dailyTemperatures.length; // Calculate the average temperature, because Bright Sky API provides temperature values from DWD hourly and not daily average

        return [{
            YYYYMMDD: parseInt(format(date, "yyyyMMdd")),
            Temperature: parseFloat(avgTemp.toFixed(1)) // Round to 1 digit after decimal point
        }];
    };

    // Gathers temperature data for a range of dates
    const fetchAllData = async () => {
        const today = new Date();
        const startDate = subDays(today, numDays - 1); // Calculate the start date
        let allData: Data[] = [];
        for (let date = startDate; date <= today; date = addDays(date, 1)) {
            const [dailyAverage] = await fetchData(date);
            allData.push(dailyAverage);
        }
        setDailyAverages(allData);
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    // Update numDays when the number of days in input element changes
    const handleNumDaysChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newNumDays = parseInt(event.target.value, 10);
        if (!isNaN(newNumDays) && newNumDays > 0) {
            setNumDays(newNumDays);
        }
    };

    // Trigger data fetching based on the input number of days after clicking the fetching button
    const handleFetchDataClick = () => {
        fetchAllData(); // Call the function to fetch data for the last numDays days
    };

    const handleSortClick = () => {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    };

    // Filter and sort the dates and filter daily average temperature values
    const getFilteredAndSortedData = () => {
        let filteredData = dailyAverages;
        if (searchTerm) {
            const searchNumber = Number(searchTerm);
            if (!isNaN(searchNumber)) {
                filteredData = filteredData.filter(
                    (item) => item.YYYYMMDD === searchNumber || item.Temperature === searchNumber
                );
            }
        }

        return filteredData.sort((a, b) =>
            sortOrder === "asc"
                ? b.YYYYMMDD - a.YYYYMMDD
                : a.YYYYMMDD - b.YYYYMMDD
        );
    };

    // Display the data as table and graph
    return (
        <ThemeProvider
            breakpoints={["xxxl", "xxl", "xl", "lg", "md", "sm", "xs", "xxs"]}
            minBreakpoint="xxs"
        >
            <Container>
                <h1 className="text-center">Review of historical daily temperature values for the city of Dresden with Bright Sky API</h1>
                <div>
                    <Row>
                        <Col>
                            <Form>
                                <Form.Group>
                                    <Form.Label>Search by exact date or temperature, filter by exact temperature</Form.Label>
                                    <Form.Control
                                        type="search"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                    />
                                </Form.Group>
                            </Form>
                            <Table striped bordered hover>
                                <thead className="align-middle">
                                <tr>
                                    <th>
                                        <Form>
                                            <Form.Group>
                                                <Form.Label>Enter the number of days:</Form.Label>
                                                        <Container>
                                                            <Row sm={2} md={2} lg={2} xl={2} xxl={2}>
                                                                <Col>
                                                                    <Form.Control
                                                                        className="w-3"
                                                                        type="number"
                                                                        value={numDays}
                                                                        onChange={handleNumDaysChange}
                                                                    />
                                                                </Col>
                                                                <Col>
                                                                    <Button variant="outline-secondary" onClick={handleFetchDataClick}>
                                                                        Fetch Data
                                                                    </Button>
                                                                </Col>
                                                            </Row>
                                                        </Container>
                                            </Form.Group>
                                        </Form>
                                    </th>
                                    <th>
                                        <Container>
                                            <Row>
                                                <Col>Date (YYYYMMDD)</Col>
                                                <Col>
                                                    <Button variant="outline-secondary" onClick={handleSortClick}>
                                                        {sortOrder === "asc" ? "▲" : "▼"}
                                                    </Button>
                                                </Col>
                                            </Row>
                                        </Container>
                                    </th>
                                    <th>Temperature (℃)</th>
                                </tr>
                                </thead>
                                <tbody>
                                {getFilteredAndSortedData().map((item, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{item.YYYYMMDD}</td>
                                        <td>{item["Temperature"]}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </Table>
                        </Col>
                        <Col>
                            <div className="graph-container">
                                <LineChart width={600} height={300} data={getFilteredAndSortedData()}>
                                    <XAxis dataKey="YYYYMMDD" label={{ value: "Date", position: "bottom"}}/>
                                    <YAxis dataKey="Temperature" label={{ value: "Temperature", angle: -90}}/>
                                    <CartesianGrid stroke="#eee"/>
                                    <Line type="monotone" dataKey="Temperature" stroke="#8884d8"/>
                                    <Tooltip/>
                                </LineChart>
                            </div>
                        </Col>
                    </Row>
                </div>
            </Container>
        </ThemeProvider>
    );
};

export default TemperatureReview;
