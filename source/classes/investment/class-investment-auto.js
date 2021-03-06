/**
 * Init for purchasing real estate.
 */

function investment_auto() {

	if (!invest_verify()) {
		return false;
	}

	data = invest_calculations();

	var buyThese = data['buyThese'];
	var formNonce = invest_find_formnonce();

	for (var index in buyThese) {

		var amount = buyThese[index];

		// Skip buildings that do not require a purchase
		if (amount == 0) {
			continue;
		}

		invest_purchase(parseInt(index) + 1, amount, formNonce);

	}

	alert("Newly gained income: " + numberWithCommas(data['newIncome']) + "\n\nTotal money spent: " + numberWithCommas(data['totalCost']));
}

/**
 * Confirm whether the current user can invest
 * or not by checking their level, and the current
 * page they're on.
 * @return {boolean} User is verified.
 */

function invest_verify() {

	var level = get_current_level();

	if (!level) {
		alert("Action failed. Level could not be found.")
		return false;
	}

	if (level < 7) {
		alert("Action failed. You must be level 7+ to purchase buildings.")
		return false;
	}

	if (document.URL.indexOf("investment.php") < 1) {
		alert("Action failed. You must be on the investment page to use this button");
		return false;
	}

	// Assuming all is well
	return true;

}

/**
 * Find the best ROI for each building, and
 * calculate how much of each should be bought.
 * @return {array} buyThese, newIncome, totalCost are the keys
 *                 in the return array.
 */

function invest_calculations() {

	// Initalizations
	var totalCost = 0;
	var newIncome = 0;
	var buyThese = {};

	// Cash on hand
	var spendingAmount = get_current_cash();

	// Real estate data
	var owned = invest_find_estate_data('.ownedNum');
	var cost = invest_find_estate_data('.reBuyAction .cash > span');
	var income = new invest_find_estate_data('.reInfoItem > .cash > span');

	// Initial cost of each real estate
	var initialCosts = [2000, 10000, 30000, 200000, 500000, 1100000, 4000000, 10000000, 20000000, 40000000, 55000000, 75000000, 105000000, 150000000, 250000000, 420000000];

	for (var i = 0; i < owned.length; i++) {
		buyThese[i] = 0;
	}

	Array.min = function(array) {
		return Math.min.apply(Math, array);
	};

	while (totalCost < spendingAmount) {

		// Find next building to buy
		var roi = new Array();
		for (var i = 0; i < owned.length; i++) {
			roi.push(cost[i] / income[i]);
		}

		// Find the best ROI
		minRoi = Array.min(roi);

		// Identify the best ROI
		minRoiIndex = $.inArray(minRoi, roi);

		// Cost to buy this
		costOfminRoi = cost[minRoiIndex];

		// We ran out of funds! We're done here
		if ((totalCost + costOfminRoi) > spendingAmount) {
			return {
				'buyThese': buyThese,
				'newIncome': newIncome,
				'totalCost': totalCost
			};
		}

		buyThese[minRoiIndex]++;
		newIncome += income[minRoiIndex];
		totalCost += costOfminRoi;

		// Increase cost by 10% now that it's bought
		cost[minRoiIndex] = (0.10 * initialCosts[minRoiIndex]) + costOfminRoi;

		// Increase current owned by one
		owned[minRoiIndex] += 1;

	}
}

/**
 * The csrf token should be found and used
 * when purchasing real estate.
 * @param  {string} data An HTML body, optional.
 * @return {string}      The csrf token, aka nonce.
 */

function invest_find_formnonce(data) {

	searchDis = 'a[href*="investment.php?action=buy&inv_id=1&formNonce"]';

	url = data ? $(data).find(searchDis) : $(searchDis);

	nonce = $(url).attr('href').split('&');
	nonce = nonce[2].replace('formNonce=', '');

	return nonce;

}

/**
 * Helper function for findng all instances of
 * an element, and returning it's html (text) value.
 * @param  {string} find The element, such as a[href="google.com"].
 * @return {array}      Each instance of the found's text value.
 */

function invest_find_estate_data(find) {

	var temp = new Array();

	$(find).each(function(index) {
		temp.push(format_number($(this).html()));
	});

	return temp;

}

/**
 * Purchase a set amount of real estate.
 * @param  {int} itemID    The estate's ID.
 * @param  {int} amount    Amount to purchase.
 * @param  {string} formNonce A unique token, set by the website.
 */

function invest_purchase(itemID, amount, formNonce) {

	$.ajax({
		type: 'POST',
		url: 'http://im.storm8.com/investment.php?action=buy&formNonce=' + formNonce + '&inv_id=' + itemID,
		data: {
			numberOfInv: amount
		},
		success: function(dataReturn) {
			formNonce = invest_find_formnonce(dataReturn);
		},
		async: false
	});

}