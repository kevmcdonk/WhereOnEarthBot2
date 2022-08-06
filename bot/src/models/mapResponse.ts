export interface Place {
    name: string;
    address: string;
    placeId: string
    types: string[];
    opened: Opening;
    geo: Geometry;
    photos: Photo[];
}

export interface Photo {
    photoReference: string;
    rating: number;
    height: number;
}

export interface Detail {
    name: string;
    rating: number;// = -5;
    price_level: number;// = -5;
    address: string;
    phone: string;
    open: Opening;
}

export interface Opening {
    now: boolean;// = false;
    //periods: Period[];
}

export interface DailyChallengeTeam {
    open: Range;
    close: Range;
}

export interface Range {
    day: number;
    time: number;
    parseTime: Date;
    /*
        public static DateTime ParseTime(int day, short s)
        {
            DateTime dt = DateTime.Today.AddDays(day - (int)DateTime.Today.DayOfWeek);
            return new DateTime(dt.Year, dt.Month, dt.Day, s / 100, s % 100, 0);
        }
    */
}

export interface Geometry {
    location: Location;
}

export interface Location {
    latitude: number;
    longitude: number;
}

export interface MapResponse {
    detail: Detail;
    places: Place[];
    next_page_token: string;
    status: string;
}
